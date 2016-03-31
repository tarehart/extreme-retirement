
var game = new Phaser.Game(1280, 720, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('background','img/debug-grid-1920x1920.png');
    game.load.image('player','img/jake-parachute.png');
    game.load.image('angel','img/ugly-angel.png');
    game.load.image('log','img/log.png');

}

var player;
var angel;
var background;
var balanceTxt;
var ageTxt;
var cursors;
var balance;
var interestRate;
var spendAmount;
var DOLLARS_PER_PIXEL = 1000;
var PIXELS_PER_MONTH = 200;
var months = 0;

function create() {

    background = game.add.tileSprite(0, 0, 1920, 1920, 'background');

    // World bounds max out at 10 million dollars.
    var worldHeight = 10000000 / DOLLARS_PER_PIXEL;
    game.world.setBounds(0, -worldHeight, 5000, worldHeight + 100);

    game.physics.startSystem(Phaser.Physics.P2JS);



    cursors = game.input.keyboard.createCursorKeys();



    balance = 1500000;
    interestRate = .04 / 12;
    spendAmount = 6000;

    player = game.add.sprite(game.world.bounds.x + 50, balanceToY(balance), 'player');
    player.scale.setTo(.5, .5);
    player.vitals = {
        initialAge: 65,
        ageAtDeath: getDeath(65),
        isAlive: true
    };

    game.physics.p2.enable(player);
    game.camera.follow(player);

    balanceTxt = game.add.text(0, 0, "");
    ageTxt = game.add.text(0, 0, "");

    var startingY = balanceToY(balance);

    for (var i = 0; i < 30; i++){
        var logDenied = getRandomInt(0, 4);
        for (var j = 0; j < 4; j++){
            if (j === logDenied){
                continue;
            }
            var logHeight;
            var logX;
            logX = game.world.bounds.x + 500 + j * 75;
            logHeight = startingY + i * 150;
            var log = game.add.sprite(logX, logHeight, 'log');
            log.scale.setTo(.25, .25);
            game.physics.p2.enable(log);
            log.body.static = true;
        }

    }


}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function update() {

    months++;

    if (player.vitals.isAlive) {
        var currentAge = player.vitals.initialAge + Math.floor(months / 12);
        ageTxt.text = currentAge + "";
        if (currentAge === player.vitals.ageAtDeath) {
            doDie();
        }
    }

    if (balance > 0) {
        var interest = balance * interestRate;
        balance += interest - spendAmount;

        player.body.y = balanceToY(balance);
        player.body.moveRight(PIXELS_PER_MONTH);
    } else {
        balance = 0;
    }

    balanceTxt.text = accounting.formatMoney(balance);


    if (cursors.up.isDown)
    {
        player.body.moveUp(300);
    }
    else if (cursors.down.isDown)
    {
        player.body.moveDown(300);
    }

    if (cursors.left.isDown)
    {
        player.body.moveLeft(300);
    }
    else if (cursors.right.isDown)
    {
        player.body.moveRight(300);
    }

    background.x = player.body.x - background.width / 2;
    background.y = player.body.y - background.height / 2;
    background.tilePosition.x = -background.x;
    background.tilePosition.y = -background.y;

    balanceTxt.x = player.body.x + 100;
    balanceTxt.y = player.body.y;

    ageTxt.x = player.body.x;
    ageTxt.y = player.body.y + 100;

}

function initAngel() {
    angel = game.add.sprite(player.body.x, player.body.y - 20, 'angel');
    angel.scale.setTo(.5, .5);
    game.physics.p2.enable(angel);
    angel.body.velocity.y = -5;

}

function render() {

    game.debug.cameraInfo(game.camera, 32, 32);
    game.debug.spriteCoords(player, 32, 500);

}

function balanceToY(balance) {
    //  The world goes from -10,000 at the top to 0 at the bottom. A negative value is high in the air. 0 is on the ground.
    return -balance / DOLLARS_PER_PIXEL;
}
function doDie() {
    player.vitals.isAlive = false;
    initAngel();
}

function getDeath(startAge) {
    return RetireUtils.ageAtDeath(startAge);
}
