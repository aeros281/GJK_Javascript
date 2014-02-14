// The object for holding Raphael's paper object,
// must be 'var' first for the use of another function
// beside window.onload()
var paper;

// The direction for gjk algorihm
var d;
var pol2;
var pol1;


// The window.onload() function
window.onload = function () {

	var drawing = false;

	// Create a Raphael's paper object and send it to
	// the declared variable above
	paper = Raphael('canvas', '100%', window.innerHeight - 60);

	paper.canvas.style.backgroundColor = '#DDDDDD';

	pol2 = Polygon([Point(500, 100), Point(200, 600), Point(700, 600)], 'blue');
	pol2.draw();

	// Create a simple polygon
	pol1 = Polygon([Point(701, 388), 
				Point(1693, 379), 
				Point(1693, 679), 
				Point(1293, 679), 
				Point(834, 588)]
		, '#2CDD52');
	pol1.draw();
	console.log(pol1.points);
	pol1.makeDraggable();

	console.log(pol1.checkCollision(pol2));
};

// Defines Vector object 

var Vector = function (x, y) {
	var that = {};

	that.x = x;
	that.y = y;

	// substract function
	that.substract = function (vtr) {
		return Vector(that.x - vtr.x, that.y - vtr.y);
	};

	// translate function
	that.translate = function (vtr) {
		that.x = that.x + vtr.x;
		that.y = that.y + vtr.y;
	};

	that.dot = function (vtr) {
		return that.x * vtr.x + that.y * vtr.y;
	};

	that.plus = function (num) {
		return Vector(that.x * num, that.y * num);
	};

	that.negate = function () {
		return Vector(-that.x, -that.y);
	};

	that.normalise = function () {
		if (that.x == 0 && that.y == 0) {
			that.x = that.y = 0;
			return that;
		}
		if (that.x == 0) {
			that.y = 1;
			return that;
		}
		if (that.y == 0) {
			that.x = 1;
			return that;
		}

		var temp = gcd(that.x, that.y);

		that.x = that.x / temp;
		that.y = that.y / temp;

		return that; 
	}

	return that;
};

// Defines Point object
var Point = function (x, y) {
	// inherited from Vector object
	var that = Vector(x, y);

	return that;
};

// Defines Polygon object
var Polygon = function (arrPoint, fillcolor) {
	var that = this.paper.path('')
					.attr({
						fill : fillcolor,
						stroke : fillcolor
					});

	that.points = arrPoint;

	that.addPoint = function (pt) {
		that.points.push(pt);
	}

	that.calculatePath = function () {
		var _pstring = 'M' + that.points[0].x + ',' + that.points[0].y;

		var i;
		for (i=1; i < that.points.length; i++) {
			_pstring += 'L' + that.points[i].x + ',' + that.points[i].y;
		}

		_pstring += 'Z';

		return _pstring;
	}

	that.draw = function () {
		that.attr('path', that.calculatePath());
	}

	that.clearpath = function () {
		that.attr('path', '');
	}

	that.furthestPoint = function (direction) {
		var fPoint, maxDot;
		var i;

		maxDot = -343874343434;

		for (i = 0; i < that.points.length; i++) {
			if (that.points[i].dot(direction) > maxDot) {
				fPoint = that.points[i];
				maxDot = that.points[i].dot(direction);
			}
		}

		return fPoint;
	};

	that.checkCollision = function(B) {
		var simplex = [];

		// Choose a direction
		d = Vector(0, 1);

		// get the first minkowski diff point
		simplex.push(furthestMinkowski(this, B, d));

		d = d.negate();

		// start looping
		while (true) {
			// add a new point to the simplex 
			simplex.push(furthestMinkowski(this, B, d));
			// make sure that the last point we added 
			// pass the origin
			if (simplex[simplex.length - 1].dot(d) <= 0) {
				// if the point added last was not past the origin in the direction of d
				// then the Minkowski diff cannot possibly contain the origin since 
				// the last point added is on the edge of the Minkowski diff
				return false;
			} else {
				// otherwise we need to determine if the origin is in
				// the current simplex
				if (containsOrigin(simplex)){
					return true;
				}
			}
		}
	};

	that.makeDraggable = function () {
		that.attr('cursor', 'move');

		//Add draggable feature
		var start = function () {
			that.attr('opacity', .7);
			that.ox = 0;
			that.oy = 0;

			that.ocx = that.getBBox().cx;
			that.ocy = that.getBBox().cy;
		}

		var move = function (dx, dy) {
		
			var _tstring = '...t' + (dx - that.ox) + ',' + (dy - that.oy);

			that.attr('path', 
				Raphael.transformPath(that.attr('path'), _tstring));

			that.ox = dx;
			that.oy = dy;

		}

		var end = function () {
			that.attr('opacity', 1);

			var translateVtr = Vector(that.getBBox().cx - that.ocx, that.getBBox().cy - that.ocy);
			var i;
			for (i = 0; i < that.points.length; i++) {
				that.points[i].translate(translateVtr);
			}

			that.ocx = that.getBBox().cx;
			that.ocy = that.getBBox().cy;

			console.log(pol1.points);

			if(that.checkCollision(pol2)) {
				that.attr({
					fill: 'red',
					stroke: 'red'
				});
			} else {
				that.attr({
					fill: '#2CDD52',
					stroke: '#2CDD52'
				});
			}
		}

		that.drag(move, start, end);
	}

	return that;
};

// Helper function

function gcd(a,b) {
    if (a < 0) a = -a;
    if (b < 0) b = -b;
    if (b > a) {var temp = a; a = b; b = temp;}
    while (true) {
        a %= b;
        if (a == 0) return b;
        b %= a;
        if (b == 0) return a;
    }
}

var tripleProduct = function (A, B, C) {
	// (A x B) x C = B(C.A) - A(C.B)
	var left = B.plus(C.dot(A));
	var right = A.plus(C.dot(B));

	var result = left.substract(right);

	return result.normalise();
};

// furthest Point in the Minkowski diff between A and B for a direction d
var furthestMinkowski = function (A, B, d) {
	var a, b, nd;
	// furthest point in A for d
	a = A.furthestPoint(d);

	// furthest point in B for -d
	nd = d.negate();
	b = B.furthestPoint(nd);

	return a.substract(b);
};

var containsOrigin = function (simplex) {
	var a, b, c, ab, ac;
	var abPerp, acPerp;

	// Get the last point added to simplex
	a = simplex[simplex.length - 1];
	// compute AO
	var ao = a.negate();
	if (simplex.length == 3) {
		// then it's the  triangle case
		// get b and c;
		b = simplex[0];
		c = simplex[1];

		// compute the edges
		ab = b.substract(a).normalise();
		ac = c.substract(a).normalise();

		// compute the normals
		abPerp = tripleProduct(ac, ab, ab);
		acPerp = tripleProduct(ab, ac, ac);

		// is the origin is outside of ab
		if (abPerp.dot(ao) > 0) {
			// remove point c (index 1)
			simplex.splice(1, 1);

			d = abPerp;
		} else {
			// is the origin outside of ac
			if (acPerp.dot(ao) > 0) {
				// remove point b (index 0)
				simplex.splice(0, 1);

				// set the new direction to acPerp
				d = acPerp;
			} else {
				// otherwise we know simplex contains origin
				return true;
			}
		}
	} else {
		// then it's the line segment case
		b = simplex[0];

		// compute ab
		ab = b.substract(a).normalise();

		// get perp to ab in the direction of the origin
		abPerp = tripleProduct(ab, ao, ab);

		// set the direction to abPerp
		d = abPerp;

	}
	return false;
};

