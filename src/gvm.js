const MEMORY = Array(50*1024).fill(0);
var PROGRAM_END = 0;

function ERROR(func, error) {
	console.error('Error in '+func+': '+error);
	process.exit(1)
}

function testShort(called, short) {
	//console.log(typeof(short)) // typeof(short) == 'number'
	if ( typeof(short) === 'number' ) {
		if ( short % 1 == 0 && short >= 0 && short < 256**4 ) {
			return true;
		} else {
			ERROR(called, 'value is not a short number '+ short);
		}	
	}
	else { ERROR(called, 'value is not a number '+ short); }

};

function getShort(address) {
	testShort('getShort, address ', address);
	// least significant first
	var a = [
		MEMORY[address],
		MEMORY[address+1],
		MEMORY[address+2],
		MEMORY[address+3]
		];
	return a[0] + (a[1]<<8) + (a[2]<<16) + (a[3]<<24);
};

function shortWrap(short) {
	//short = short % 1
	if (short > 256**4) { short -= 256**4 }
	if (short < 0) { short += 256**4 }
	return short;
}

function setShort(address, short) {
	testShort('setShort, value', short); 
	testShort('getShort, address', address);
	MEMORY[address] = short & 255;
	MEMORY[address+1] = (short>>8) & 255;
	MEMORY[address+2] = (short>>16) & 255;
	MEMORY[address+3] = (short>>24) & 255;
};

function regShort(register) {
	testShort('regShort, register', register);
	// least significant first
	var a = [
		REGISTERS[register],
		REGISTERS[register+1],
		REGISTERS[register+2],
		REGISTERS[register+3]
		];
	
	//console.log(
	//	[a[0] , (a[1]<<8) , (a[2]<<16) , (a[3]<<24)]
	//	)
	
	return a[0] + (a[1]<<8) + (a[2]<<16) + (a[3]<<24);
}

function setReg(register, integer) {
	//console.log('\tsetReg', register,integer);
	integer = shortWrap(integer);
	//console.log('int', integer);
	REGISTERS[register] = integer & 255;
	REGISTERS[register+1] = (integer>>8) & 255;
	REGISTERS[register+2] = (integer>>16) & 255;
	REGISTERS[register+3] = (integer>>24) & 255;
}

const REGISTERS = Array(4*9+1).fill(0);
	const eax = 0;
	const ecx = 1*4;
	const edx = 2*4;
	const ebx = 3*4;
	const carry = 4*4;
	const zero = 5*4;
	const fp = 6*4;
	const sp = 7*4;
	const ip = 8*4;

const OPCODES = {}
function EXE(address) {
	var code = MEMORY[address];
	const operation = OPCODES[code];
	try { 
		 operation(address, code)
	}
	catch(error) { 
		ERROR('EXE', 'unknown operation '+ error) 
	}
	
	return [code, '@'+address];
};

// addition
for (let c=0; c<8; c++) {
	OPCODES[c] = (a,i) => {
		var br = i*4; 	
		var ar = MEMORY[a+1];
		var bV = regShort(br);
		var aV = regShort(ar);
		setReg(br, bV+aV);
		setReg(ip, regShort(ip)+2);
	}
}

// increment
for (let c=9; c<9+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-9)*4; 	
		var bV = regShort(br);
		setReg(br, bV++);
		setReg(ip, regShort(ip)+1);
	}
}

// subtraction
for (let c=17; c<17+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-17)*4; 	
		var ar = MEMORY[a+1];
		var bV = regShort(br);
		var aV = regShort(ar);
		setReg(br, bV-aV);
		setReg(ip, regShort(ip)+2);
	}
}

// decrement
for (let c=26; c<26+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-26)*4; 	
		var bV = regShort(br);
		setReg(br, bV--);
		setReg(ip, regShort(ip)+2);
	}
}

// multiply
for (let c=35; c<35+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-35)*4; 	
		var ar = MEMORY[a+1];
		var bV = regShort(br);
		var aV = regShort(ar);
		setReg(br, bV*aV);
		setReg(ip, regShort(ip)+2);
	}
}

// divide
for (let c=44; c<44+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-44)*4; 	
		var ar = MEMORY[a+1];
		var bV = regShort(br);
		var aV = regShort(ar);
		setReg(br, bV/aV);
		setReg(ip, regShort(ip)+5);
	}
}

// compare
OPCODES[253] = (a,i) => {
	//for(let i=0; i<16; i++){console.log(MEMORY[i])}
	var A = MEMORY[a+1];
	var B = MEMORY[a+2];
	//console.log('>> compare', A,B);
	if ( A > B ) { setReg(carry, 1) }
	else { setReg(carry, 0) }
	if ( A == B ) { setReg(zero, 1) }
	else { setReg(zero, 0) }
	setReg(ip, regShort(ip)+3);
}

// if equals
OPCODES[208] = (a,i) => {
	var ptr = getShort(a+1);
	if ( regShort(zero) == 1 ) {
		setReg(ip, regShort(ptr));
	}
	else {
		setReg(ip, regShort(ip)+5);	
	}
}

// if not equals
OPCODES[209] = (a,i) => {
	var ptr = getShort(a+1);
	if ( regShort(zero) == 0 ) {
		setReg(ip, regShort(ptr));
	}
	else {
		setReg(ip, regShort(ip)+5);	
	}
}

// if greater
OPCODES[210] = (a,i) => {
	var ptr = getShort(a+1);
	if ( regShort(carry) == 1 && regShort(zero) == 0 ) {
		setReg(ip, regShort(ptr));
	}
	else {
		setReg(ip, regShort(ip)+5);	
	}
}

// if less
OPCODES[211] = (a,i) => {
	var ptr = getShort(a+1);
	if ( regShort(carry) == 0 && regShort(zero) == 0 ) {
		setReg(ip, regShort(ptr));
	}
	else {
		setReg(ip, regShort(ip)+5);	
	}
}

// if ge
OPCODES[210] = (a,i) => {
	var ptr = getShort(a+1);
	if ( regShort(carry) == 1 || regShort(zero) == 0 ) {
		setReg(ip, regShort(ptr));
	}
	else {
		setReg(ip, regShort(ip)+5);	
	}
}

// if le
OPCODES[210] = (a,i) => {
	var ptr = getShort(a+1);
	if ( regShort(carry) == 0 || regShort(zero) == 0 ) {
		setReg(ip, regShort(ptr));
	}
	else {
		setReg(ip, regShort(ip)+5);	
	}
}

// move
for( let c=160; c<160+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-160)*4; 	
		var ar = MEMORY[a+1];
		setReg(br, regShort(ar));
		setReg(ip, regShort(ip)+2);
	}
}

// load
for( let c=169; c<169+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-169)*4; 	
		var ar = getShort(a+1); // address
		setReg(br, getShort(ar));
		setReg(ip, regShort(ip)+5);
	}
}

// store
for( let c=177; c<177+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-177)*4; 	
		var ar = getShort(a+1);
		setShort(ar, regShort(br));
		setReg(ip, regShort(ip)+5);
	}
}

// set
for( let c=186; c<186+8; c++) {
	OPCODES[c] = (a,i) => {
		var br = (i-186)*4; 	
		var ar = getShort(a+1);
		//console.log('ASKED TO SET',br,'->',ar);
		setReg(br, ar);
		setReg(ip, regShort(ip)+5);
	}
}

// interrupts
OPCODES[128] = (a,i) => {

	var sys = MEMORY[a+1];
	// system calls
	if (sys == 80) {
		var sys = regShort(eax);

		// exit with status
		if (sys == 1) {
			process.exit( regShort(ebx) );
		}

		// buffer write
		if (sys == 4) {
			var descriptor = regShort(edx);
			var buffer = regShort(ebx);
			var pointer = regShort(ecx);
			var result = '';
			for(let c=0; c<buffer; c++){
				result += String.fromCharCode(MEMORY[c+pointer]);
			}
			console.log(result);
		}
		
	}

	setReg(ip, regShort(ip)+2);
}


// cpu loop
//ip=addr
function register_log() {
	console.log(
		'<< Register State >>\n',
		'\teax:'+regShort(eax)+'\t\t',
		'ebx:'+regShort(ebx)+'\t\t',
		'ecx:'+regShort(ecx)+'\t\t',
		'edx:'+regShort(edx)+'\t\n',
		
		'\tcf:'+regShort(carry)+'\t\t',
		'zf:'+regShort(zero)+'\t\t',
		'sp:'+regShort(sp)+'\t\t',
		'ip:'+regShort(ip)+'\n',
	);	
}

function cpu(){
	//console.log(OPCODES);
	while( getShort(regShort(ip)) != 0 ) {
		var ptr = regShort(ip);
		var state = EXE(ptr);
	}
	register_log();
}

function cpu_write(address, bytearray){
	for(let byte=0; byte<bytearray.length;byte++) {
		MEMORY[address+byte] = bytearray[byte]
	}
	if( PROGRAM_END == 0) { PROGRAM_END = bytearray.length };
	//console.log('Wrote', bytearray.length, 'bytes into memory!')
};

module.exports = {
	cpu,
	cpu_write
}





