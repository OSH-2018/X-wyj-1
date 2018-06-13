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


var CRDT = () => {

}

CRDT.prototype.applyChange = (change) => {

};

