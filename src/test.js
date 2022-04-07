const gvm = require('./gvm.js');
	const eax = 0;
	const ecx = 1*4;
	const edx = 2*4;
	const ebx = 3*4;
	const carry = 4*4;
	const zero = 5*4;
	const fp = 6*4;
	const sp = 7*4;
	const ip = 8*4;

gvm.cpu_write(0, [
	186, 4, 0, 0, 0, // set eax 4: write string
	186+3, 13, 0, 0, 0, // set ebx: 12 bytes
	186+1, 34, 0, 0, 0, // set ecx: pointer
	186+2, 1, 0, 0, 0, // set edx: std.out
	128, 80, // interrupt
	
	186, 1, 0, 0, 0, // set eax 1: exit
	186+3, 0, 0, 0, 0, // ebx: status 0
	128, 80, // interrupt
	
	
	// "Hello, world!" @17
	72, 101, 108, 108,
	111, 44, 32, 87,
	111, 114, 108, 100,
	33
])

gvm.cpu()
