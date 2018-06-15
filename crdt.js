var BASE = 256;

var add = (n1, n2) => {
	var carry = 0;
    var diff = new Array();
    for (var i = Math.max(n1.length, n2.length) - 1; i >= 0; i--) {
        var sum = (n1[i] || 0) + (n2[i] || 0) + carry;
        carry = Math.floor(sum / BASE);
        diff[i] = (sum % BASE);
    }
    if (carry !== 0) {
    	console.log('Something wrong');
    }
    return diff;
};

var subtract = (n1,n2) => {
	var carry = 0;
    var diff = new Array();
    for (let i = Math.max(n1.length, n2.length) - 1; i >= 0; i--) {
        var d1 = (n1[i] || 0) - carry;
        var d2 = (n2[i] || 0);
        if (d1 < d2) {
            carry = 1;
            diff[i] = d1 + BASE - d2;
        } else {
            carry = 0;
            diff[i] = d1 - d2;
        }
    }
    return diff;
};

var fromIdentifiers = (identifiers) => {
	return identifiers.map(id => id.digit);
};

var toIdentifiers = (num, before, after, site) => {
	return num.map((digit, index) => {
		if (index === num.length - 1) {
			return identifier(digit, site);
		}
		else if (index < before.length && digit === before[index].digit) {
			return identifier(digit, before[index].site);
		}
		else if (index < after.length && digit === after[index].digit) {
			return identifier(digit, after[index].site);
		}
		else {
			return identifier(digit, site);
		}
	});
};

var increment = (num, delta) => {
	var firstNonzero = delta.findIndex(x => x !== 0);
	var inc = delta.slice(0, firstNonzero).concat([0, 1]);
	var v1 = add(n1, inc);
	var v2 = v1[v1.length - 1] === 0 ? add(v1, inc) : v1;
	return v2;
};

var identifier = (digit, site) => {
	return {
		digit : digit || 0,
		site : site || 0
	};
};

var char = (identifiers, lamport, value) => {
	return {
		position : identifiers || [],
		lamport : lamport || 0,
		value : value || ''
	};
};

var startOfFile = char({digit:1,site:0}, 0, '^');
var endOfFile = char({digit:255,site:0}, 0, '$');

var compareIdentifier = (i1, i2) => {
	if (i1.digit < i2.digit) {
		return -1;
	} else if (i1.digit > i2.digit) {
		return 1;
	} else {
		if (i1.site < i2.site) {
			return -1;
		} else if (i1.site > i2.site) {
			return 1;
		} else {
			return 0;
		}
	}
};

var equalChar = (c1, c2) => {
    if (c1.position.length !== c2.position.length) return false;
    if (c1.lamport !== c2.lamport) return false;
    if (c1.value !== c2.value) return false;
    for (let i = 0; i < c1.position.length; i++) {
        if (compareIdentifier(c1.position[i], c2.position[i]) !== 0) return false;
    }
    return true;
};

var comparePosition = (p1, p2) => {
	for (var i = 0; i < Math.min(p1.length, p2.length); i++) {
		var comp = compareIdentifier(p1[i], p2[i]);
		if (comp !== 0)
			return comp;
	}
	if (p1.length < p2.length) {
		return -1;
	} else if (p1.length > p2.length) {
		return 1;
	} else {
		return 0;
	}
};

var compareChar = (c1, c2) => {
	return comparePosition(c1.position, c2.position);
}

var generatePositionBetween = (p1, p2, site) => {
	var head1 = p1[0] || identifier(0, site);
	var head2 = p2[0] || identifier(BASE, site);
	if (head1.digit !== head2.digit) {
		var n1 = fromIdentifiers(p1);
		var n2 = fromIdentifiers(p2);
		var delta = subtract(n2, n1);
		var next = increment(n1, delta);
		return toIdentifiers(next, p1, p2, site);
	} else {
		if (head1.site < head2.site) {
			return [head1].concat(generatePositionBetween(p1.splice(0,1), [], site));
		}
		else if (head1.site === head2.site) {
			return [head1].concat(generatePositionBetween(p1.splice(0,1), p2.splice(0,1), site));
		} else {
			console.log('Invalid site ordering');
		}
	}
};

var binarySearch = (U, V, comparator, notFoundBehavior) => {

    var _binarySearch = (start, end) => {
        if (start >= end) {
            switch (notFoundBehavior) {
                case "at":
                    return start;
                case "before":
                    return start - 1;
                 default:
                 	return start;
            }
        } else {
            const mid = Math.floor((start + end) / 2);
            const comp = comparator(V, U[mid]);
            if (comp < 0) {
                return _binarySearch(start, mid);
            } else if (comp > 0) {
                return _binarySearch(mid + 1, end);
            } else {
                return mid;
            }
        }
    }
    return _binarySearch(0, U.length);
};


var CRDT = () => {
	this.crdt = [[]];
}

//deep copy
CRDT.prototype.getChar = (lineIndex, charIndex) => {
	const c = this.crdt[lineIndex][charIndex];
	return char(c.position.map(i => {digit : i.digit, site : i.site}), c.lamport, c.value);
};

//deep copy
CRDT.prototype.getLine = (lineIndex) => {
	return this.crdt[lineIndex].map((char, charIndex) => this.getChar(lineIndex, charIndex));
};

CRDT.prototype.compareCharWithLine = (char, line) => {
	if (line.length === 0)
		return -1;
	else {
		return compareChar(char, line[0]);
	}
};

CRDT.prototype.findPosition = (char) => {
	const lineIndex = Math.max(0, binarySearch(this.crdt, char, compareCharWithLine, "before"));
	const line = this.getLine(lineIndex);
	const charIndex = binarySearch(line, char, compareChar, "at");
	if (charIndex < line.length) {
        var found = compareChar(crdt[lineIndex][charIndex], char) === 0;
        return [lineIndex, charIndex, found ? "found" : "not_found"];
    } else {
        const isAfterNewline = (charIndex === line.length) && (lineIndex !== crdt.length - 1);
        // All lines except the last one need to end in a newline, so put this character
        // on the next line if it would go at the end of the line.
        if (isAfterNewline) {
            return [lineIndex + 1, 0, "not_found"];
        } else {
            return [lineIndex, charIndex, "not_found"];
        }
    }
};

CRDT.prototype.getPreChar = (lineIndex, charIndex) => {
	if (charIndex === 0) {
        if (lineIndex === 0) {
            return startOfFile;
        } else {
            return this.getChar(lineIndex - 1, this.crdt[lineIndex - 1].length - 1);
        }
    } else {
        return this.getChar(lineIndex, charIndex - 1);
    }
};

CRDT.prototype.updateCrdtRemove = (crdt, change) => {
    const lines = this.crdt.slice(change.from.line, change.to.line + 1);
    const linesAndUpdates = lines.map((line, index) => {
        const startIndex;
        const endIndex;
        if (index === 0) {
            startIndex = change.from.ch;
        } else {
            startIndex = 0;
        }
        if (index === lines.length - 1) {
            endIndex = change.to.ch;
        } else {
            endIndex = line.length;
        }
        var toRemove = line.slice(startIndex, endIndex);
        if (toRemove.length !== endIndex - startIndex) {
            alert("size does not match");
        }
        line.splice(startIndex, endIndex - startIndex);
        return [line, toRemove];
    });
    const updatedLines = linesAndUpdates.map(tuple => tuple[0]);
    const _toRemove = linesAndUpdates.map(tuple => tuple[1]);
    const toRemove = [];
    _toRemove.forEach(array => toRemove = toRemove.concat(array));

    // Only the first and last line should be non-empty, so we just keep those.
    if (lines.length === 1) {
		this.crdt[change.from.line] = updatedLines[0];
    } else {
        const remainingLine = updatedLines[0].concat(updatedLines[updatedLines.length-1]);
        this.crdt.splice(change.from.line, lines.length, remainingLine);
    }
    return toRemove;
}

CRDT.prototype.updateCrdtInsert = (lamport, site, change) => {
	const lineIndex = change.from.line;
    const ch = change.from.ch;
    const line = crdt[lineIndex];
    const before = line.slice(0, ch);
    const after = line.slice(ch, line.length);

    let previousChar = this.getPreChar(lineIndex, ch);
    const nextChar = this.getChar(lineIndex, ch);
    let currentLine = before;
    const lines = [];
    const addedChars = [];
    change.text.forEach(addedChar => {
        const newPosition = generatePositionBetween(
            previousChar.position, nextChar.position, site);
        const newChar = char(newPosition, lamport, addedChar);
        currentLine = currentLine.push(newChar);
        if (addedChar === "\n") {
            lines.push(currentLine);
            currentLine = []
        }

        addedChars.push(newChar);
        previousChar = newChar;
    });

    currentLine = currentLine.concat(after);
    lines.push(currentLine);

    this.crdt.splice(lineIndex, 1, ...lines);
    return addedChars;
}

CRDT.prototype.remoteInsert = (char) => {
    const [lineIndex, ch, found] = this.findPosition(char);
        const line = this.getLine(lineIndex);
        if (found === "not_found") {
            const change = {
                from : {line : lineIndex, ch}, 
                to : {line: lineIndex, ch}, 
                text : char.value
            };
            if (char.value === "\n") {
                const before = line.slice(0, ch);
    			const after = line.slice(ch, line.length);
                this.crdt.splice(lineIndex, 1, ...[before.push(char), after]);
                return change;
            } else {
                this.crdt[lineIndex].splice(ch, 0, char);
                return change;
            }
        } else {
            // Probably means we got a duplicate for some reason
            alert('Remote insertion encounters duplication');
            return null;
        }
};

CRDT.prototype.remoteDelete = (char) => {
        const [lineIndex, ch, found] = this.findPosition(char);
        let line = this.getLine(lineIndex);
        if (found === "found" && equalChar(line[ch], char)) {
            line.splice(ch, 1);
            const nextLine = this.getLine(lineIndex + 1);

            if (line.findIndex(char => char.value === "\n") < 0 && nextLine) {
                // Newline character was removed, need to join with the next line
                const change = {
                    from : {line: lineIndex, ch}, 
                    to : {line: lineIndex + 1, ch: 0}, 
                    text : ""
                };
                this.crdt.splice(lineIndex, 2, line.concat(nextLine));
                return change;
            } else {
                const change = {
                    from : {line: lineIndex, ch},
                    to : {line: lineIndex, ch: ch + 1}, 
                    text : ""
                };
                this.crdt[lineIndex] = line;
                return change;
            }
        } else {
            alert('Remote deletion encounters duplication');
            return null;
        }
};
/*
CRDT.prototype.localInsert = (lamport, site, change) => {
        const remoteChanges = this.updateCrdtInsert(lamport, site, change);
        return remoteChanges;
};

    public localDelete(change: LocalChange): Char.t[] {
        const remoteChanges = updateCrdtRemove(change);
        return remoteChanges;
    }
*/