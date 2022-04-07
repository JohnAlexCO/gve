# gvm
A pseudo-virtual-machine designed to be a target for Garter programs. These instructions are not intended to map to any specific computer architecture -- instead, they're intended to be easy to emulate and potentially translate.

### Memory & Emulating the CPU
| Region | Position | Detail |
|---|---|---|
| Registers | *none* | `eax`, `ecx`, `edx`, `ebx`, `c`, `z`, `sp`, `fp` and `ip` |
| Program Memory  | 0 to `program-length` | (maximum of 50KB, `short` x 12,480) |
| Stack | ^ +0 to +4096 | 4KB (`short` x 1,024) |
| Free Memory | ^ +0 to +10,240 | 10KB &ndash; `fp` points to the next place unmodified by `syscalls` |

### The Opcode Table

| INSTRUCTION | OPCODE(S) | ARGUMENTS | Detail |
|---|---|---|---| 
| label | *none* | *name* | Creates a pointer to that position in the assemblage |
| add | 0 to 3 | + `register` | Add the value in `register` to `eax` and leave the result in `eax` |
| inc | 4 | `register` | increments the value in the given `register` |
| sub | 16 to 19 | + `register` | Subtract the value in `register` to `eax` and leave the result in `eax` |
| dec | 20 | `register` | decrements the value in the given `register` |
| mul | 32 to 35 | + `register` | Multiply the value in `register` to `eax` and leave the result in `eax` |
| add | 48 to 51 | + `register` | Divide the value in `register` to `eax` and leave the result in `eax` |
| db | 193 | `byte(s)` | Define arbitrary bytes in memory | 
| ds | 196 | `short` | Define an arbitrary short integer in memory | 
| compare | 253 | `register`, `register` | "Compare" two values (via subtraction) and set register flags |
| eq | 208 | `pointer` | Jump if the `zero` flag is true | 
| ne | 209 | `pointer` | Jump if the `zero` flag is false | 
| gt | 210 | `pointer` | Jump if the `zero` flag is false and the `carry` flag is true |
| lt | 211 | `pointer` | Jump if the `zero` flag is false and the `carry` flag is false |
| ge | 212 | `pointer` | Jump if the `zero` flag is true or the `carry` flag is true |
| le | 213 | `pointer` | Jump if the `zero` flag is true or the `carry` flag is false |
| move | 160 to 163 | `register`, `register` | sets the value of one register to that of another |
| load | 164 to 167 | `register`, `pointer` | sets the value of a register to the value at a memory address |
| store | 168 to 171 | `register`, `pointer` | saves the value of a register to a position in memory |
| set | 172 to 175 | `register`, `short` | sets the value of the register to an arbitrary value |
| interrupt | 128 | `byte` | signals for a program interrupt |

### Multi-Code Instructions
| Instruction | Arguments | Yield |
|---|---|---|
| push | `register` | `inc sp`, `store register sp` |
| pop | `register` | `move register sp`, `dec sp` |
| call | `pointer` | `push ip`, `push eax, ebx, ecx, & edx`, `set ip pointer` |
| return | `pointer` | `pop edx, ecx, ebx, & eax`, `pop ip` |

### The Interrupt Table
| Interrupt | eax | ebx | ecx | edx | Detail |
|---|---|---|---|---|---|
| 80 | | | | | *System Interrupts* |
| | 1 | `status` | | | Exits the program with `status` code |
| | 4 | `buffer` | `pointer` | `descriptor` | from `pointer` write bytes of length `buffer` to `descriptor` (1=`std.out`) |
| | 5 | `buffer` | `pointer` | | **OPEN**: uses the `pointer` and `buffer` to get a filename that should be read into memory and assigned a file pointer, which will be put in `eax` |
| | 6 | `buffer` | `pointer` | `file` | **READ**: reads `buffer` bytes from `file` into program memory at `pointer` |
| | 7 | `buffer` | `pointer` | `file` | **WRITE**: writes `buffer` bytes from program memory at `pointer` into `file` |




