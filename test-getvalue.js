'use strict';

const { getValueByKey } = require('./lib/key-checker');

function assertEqual(actual, expected, msg) {
  if (actual === expected) {
    console.log(`✅ ${msg}`);
    return true;
  } else {
    console.log(`❌ ${msg} (期望: ${expected}, 实际: ${actual})`);
    return false;
  }
}

let ok = true;

// Test 1: 根级字面量点号键
const obj1 = { 'a.b': 'literal', a: { b: 'nested' } };
ok &= assertEqual(getValueByKey(obj1, 'a.b'), 'literal', '根级字面量优先级');

// Test 2: 纯嵌套键
const obj2 = { a: { b: 'nested' } };
ok &= assertEqual(getValueByKey(obj2, 'a.b'), 'nested', '纯嵌套');

// Test 3: 深层嵌套中的字面量点号键
const obj3 = { parent: { 'x.y': 'literal-in-nested', x: { y: 'nested-path' } } };
ok &= assertEqual(getValueByKey(obj3, 'parent.x.y'), 'literal-in-nested', '嵌套级字面量优先级');

// Test 4: 只有嵌套路径，没有字面量
const obj4 = { parent: { x: { y: 'deep' } } };
ok &= assertEqual(getValueByKey(obj4, 'parent.x.y'), 'deep', '深层嵌套路径');

// Test 5: 不存在的键
const obj5 = { a: 1 };
ok &= assertEqual(getValueByKey(obj5, 'b.c'), undefined, '不存在的键');

// Test 6: 简单键（无点号）
const obj6 = { simple: 'value' };
ok &= assertEqual(getValueByKey(obj6, 'simple'), 'value', '简单键');

// Test 7: null/undefined 对象
ok &= assertEqual(getValueByKey(null, 'a.b'), undefined, 'null 对象');
ok &= assertEqual(getValueByKey(undefined, 'a.b'), undefined, 'undefined 对象');

process.exit(ok ? 0 : 1);
