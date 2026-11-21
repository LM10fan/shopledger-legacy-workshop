'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');
const reports = require('../lib/reports');
const coupons = require('../lib/coupons');

// In-memory fixtures only: no store import, no data/db.json access.
const item = (changes = {}) => ({id:1,name:'Rice',sku:'RICE',hsn:'1006',price:1000,qty:1,...changes});
function order(items, coupon = '', changes = {}) {
  const billed = pricing.computeTotals(items, coupon);
  return {id:9001,date:'2026-11-21',customer:'Fixture',status:'completed',items,coupon,
    subtotal:billed.subtotal,discount:billed.discount,tax:billed.tax,total:billed.total,...changes};
}

test('checkout applies 5% HSN rate', () => {
  const result = pricing.computeTotals([item()], '');
  assert.deepEqual([result.subtotal,result.discount,result.tax,result.total],[1000,0,50,1050]);
});
test('CURRENT BEHAVIOUR: invoice taxes HSN 1006 rice at default 18%', () => {
  const billed = order([item()]); const inv = invoice.computeInvoiceFigures(billed);
  assert.deepEqual([billed.tax,billed.total,inv.rows[0].gstPercent,inv.tax,inv.total],[50,1050,18,180,1180]);
});
test('CURRENT BEHAVIOUR: invoice taxes 12% HSN ghee at 18%', () => {
  const billed = order([item({name:'Ghee',hsn:'0405',price:500})]);
  const inv = invoice.computeInvoiceFigures(billed);
  assert.deepEqual([billed.tax,inv.tax,inv.total],[60,90,590]);
});
test('18% HSN with no coupon matches the ledger', () => {
  const billed = order([item({hsn:'0902',price:200,qty:2})]);
  const inv = invoice.computeInvoiceFigures(billed);
  assert.deepEqual([inv.tax,inv.total],[billed.tax,billed.total]);
});
test('checkout applies SAVE10 to taxable value before GST', () => {
  const result = pricing.computeTotals([item()], 'SAVE10');
  assert.deepEqual([result.discount,result.taxable,result.tax,result.total],[100,900,45,945]);
});
test('CURRENT BEHAVIOUR: invoice applies SAVE10 to tax-inclusive gross', () => {
  const billed = order([item()], 'SAVE10'); const inv = invoice.computeInvoiceFigures(billed);
  assert.deepEqual([inv.discount,inv.tax,inv.total],[118,180,1062]);
});
test('CURRENT BEHAVIOUR: invoice ignores SAVE10 discount cap', () => {
  const billed = order([item({hsn:'0902',price:2240})], 'SAVE10');
  const inv = invoice.computeInvoiceFigures(billed);
  assert.deepEqual([billed.discount,inv.discount,inv.total],[150,264.32,2378.88]);
});
test('CURRENT BEHAVIOUR: invoice ignores SAVE10 minimum order', () => {
  const billed = order([item({price:100})], 'SAVE10');
  const inv = invoice.computeInvoiceFigures(billed);
  assert.deepEqual([billed.discount,inv.discount,inv.total],[0,11.8,106.2]);
});
test('CURRENT BEHAVIOUR: invoice does not normalize coupon code', () => {
  const billed = order([item({hsn:'0902'})], 'save10');
  const inv = invoice.computeInvoiceFigures(billed);
  assert.equal(coupons.calculateDiscount(1000,'save10'),100);
  assert.deepEqual([billed.discount,inv.discount],[100,0]);
});
test('CURRENT BEHAVIOUR: invoice interprets decimal gstRate as percentage', () => {
  const billed = order([item({gstRate:0.05})]);
  const inv = invoice.computeInvoiceFigures(billed);
  assert.deepEqual([billed.tax,inv.tax,inv.rows[0].gstPercent],[50,0.5,0]);
});
test('GST reconciliation uses in-memory orders and excludes cancelled orders', () => {
  const db = {orders:[order([item({hsn:'0902',price:200})],'',{id:1}),
    order([item()],'',{id:2}),order([item()],'',{id:3,status:'cancelled'})]};
  const result = reports.getGstReconciliation(db);
  assert.deepEqual([result.totalChecked,result.mismatchCount,result.totalDelta],[2,1,130]);
  assert.deepEqual(result.rows.map(r=>[r.orderId,r.matched,r.delta]),[[1,true,0],[2,false,130]]);
});
test('CURRENT BEHAVIOUR: reconciliation flags tax-only mismatch with zero total delta', () => {
  const result = reports.getGstReconciliation({orders:[order([item()],'',{total:1180})]});
  assert.deepEqual([result.mismatchCount,result.totalDelta,result.rows[0].ledgerTax,result.rows[0].invoiceTax],[1,0,50,180]);
});
