(function () {

    var RetireUtils = window.RetireUtils = window.RetireUtils || {};

    // http://understandinguncertainty.org/why-life-expectancy-misleading-summary-survival
    // Plot these in excel to see a similar curve. The magnitude does not matter, we will normalize it.
    var curveConfig = [1, 2, 2, 3, 5, 7, 9, 12, 18, 25, 40, 50, 45, 5, 2, 1];

    RetireUtils.ageAtDeath = function(currentAge) {
        var rand = Math.random();
        rand = translate(rand);

        var meanRemainingYears = getLifeExpectancy(currentAge);
        var distributionMean = translate(.5);

        return Math.floor(rand * meanRemainingYears / distributionMean + currentAge);
    };

    // This is just for debugging purposes.
    RetireUtils.printHistogram = function() {
        var histo = [];

        for (var i = 0; i < 1000000; i++) {
            var age = Math.floor(RetireUtils.ageAtDeath(65));
            histo[age] = (histo[age] || 0) + 1;
        }

        for (i = 0; i < histo.length; i++) {
            if (!histo[i]) {
                console.log("");
            } else {

                var str = i + " ";
                for (var j = 0; j < histo[i] / 1000; j++) {
                    str += "*";
                }

                console.log(str);
            }
        }

    };


    function getLifeExpectancy(currentAge) {
        return 20; // TODO: use actuarial data.
    }


    /*
    Documentation for the translation functions:

    A randomly generated number has a distribution like this:

    |
    |************************
    |
    |________________________


    We want to sculpt it into a distribution like this (I'm trying to illustrate a sloped line):

    |                ********
    |        ********
    |********
    |________________________


    Our input corresponds to an area under the sloped line. We will output a value x such that the area under the line
    from 0 to x equals our input area.

    Where:
        h is the height of the triangle
        w is the width of the triangle
        c is the height of the rectangle the triangle rests on
        x is as defined above
        A is the area as defined above

     A = hxx/(2w) + cx

     Solve for x the easy way (https://www.wolframalpha.com/input/?i=A+%3D+h*x*x%2F(2w)+%2B+cx,+solve+for+x):

     x = (1/h) * (sqrt(2Ahw + ccww) - cw)

     */
    function translateToUpwardSlope(A, h, w, c) {
        return (1/h) * (Math.sqrt(2*A*h*w + c*c*w*w) - c*w);
    }

    // Trapezoid area formula
    // https://www.wolframalpha.com/input/?i=A+%3D+(h+%2B+2c+%2B+h(w+-+x)%2Fw)+*+x%2F2,+solve+for+x
    function translateToDownwardSlope(A, h, w, c) {
        return (1/h) * (-Math.sqrt(w * (w * (c + h) * (c + h) - 2 * A * h)) + c * w + h * w);
    }

    function translateToSlope(A, h1, h2, w) {
        if (h1 < h2) {
            return translateToUpwardSlope(A, h2 - h1, w, h1);
        } else if (h2 < h1) {
            return translateToDownwardSlope(A, h1 - h2, w, h2);
        } else {
            return A / h1; // Flat
        }
    }


    function getNormalizedTrapezoids(arbitraryHeights) {

        // We will take these heights and use them as input to the trapezoid rule: https://en.wikipedia.org/wiki/Trapezoidal_rule
        // We will size everything such that the total width is 1, and the total area is 1.
        // The output array will be the area of each trapezoid.

        // number of buckets will be one less than the nubmer of arbitrary heights, because they represent the spaces between.

        var bucketWidth = 1 / (arbitraryHeights.length - 1);

        var trapezoids = [];

        // Do a non-normalized first pass
        var areaSum = 0;
        for (var i = 0; i < arbitraryHeights.length - 1; i++) {
            var trapArea = bucketWidth * (arbitraryHeights[i] + arbitraryHeights[i+1]) / 2;
            trapezoids[i] = {area: trapArea, h1: arbitraryHeights[i], h2: arbitraryHeights[i+1]};
            areaSum += trapArea;
        }

        // Now normalize
        for (i = 0; i < trapezoids.length; i++) {
            var rawTrap = trapezoids[i];
            trapezoids[i] = {area: rawTrap.area / areaSum, h1: rawTrap.h1 / areaSum, h2: rawTrap.h2 / areaSum};
        }

        return trapezoids;
    }


    function translate(rand) {

        var remaining = rand;
        var normalizedTraps = getNormalizedTrapezoids(curveConfig);

        for (var i = 0; i < normalizedTraps.length; i++) {
            if (normalizedTraps[i].area >= remaining) {
                break;
            }
            remaining -= normalizedTraps[i].area;
        }
        // now i points to the correct bucket

        var trapezoid = normalizedTraps[i];
        var A = remaining;
        var w = 1 / normalizedTraps.length;

        var translated = translateToSlope(A, trapezoid.h1, trapezoid.h2, w);

        return i * w + translated;
    }

})();