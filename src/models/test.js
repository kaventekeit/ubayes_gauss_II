let myObject = {
  'test': 1,
};

console.log(Object.keys(myObject).includes('test_false'));

console.log(myObject.test_false);
console.log(myObject['test_false']);
