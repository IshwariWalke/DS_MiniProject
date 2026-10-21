const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    starterCode: {
      python: `def solution(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i
    return []
`,
      javascript: `function solution(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
`
    },
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1] }
    ]
  },
  {
    id: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'Easy',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
    starterCode: {
      python: `def solution(x):
    s = str(x)
    return s == s[::-1]
`,
      javascript: `function solution(x) {
    const s = String(x);
    return s === s.split('').reverse().join('');
}
`
    },
    testCases: [
      { input: { x: 121 }, expected: true },
      { input: { x: -121 }, expected: false },
      { input: { x: 10 }, expected: false }
    ]
  },
  {
    id: 'fibonacci',
    title: 'N-th Fibonacci Number',
    difficulty: 'Medium',
    description: 'Calculate the N-th Fibonacci number where F(0) = 0, F(1) = 1, and F(N) = F(N-1) + F(N-2).',
    starterCode: {
      python: `def solution(n):
    if n <= 0: return 0
    if n == 1: return 1
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
`,
      javascript: `function solution(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        let temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}
`
    },
    testCases: [
      { input: { n: 2 }, expected: 1 },
      { input: { n: 5 }, expected: 5 },
      { input: { n: 10 }, expected: 55 }
    ]
  }
];

module.exports = { PROBLEMS };
