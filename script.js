// DECLARATION ---------------------------------------------------------------------------

const canvas = document.getElementById("game-area")
const c = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const healthbarPlayer1 = document.getElementById("player1-hp")
const healthbarPlayer2 = document.getElementById("player2-hp")
const gameTimer = document.getElementById("game-timer")

// GAMEPLAY / CANVAS --------------------------------------------------------------------

let gameTime = 6000
let gameOver = false

class Sprite{
    constructor(x, y, imageSrc, framesHold, scale = 1, frameAmount = 1, offset = {x: 0, y: 0}, sprites){
        this.x = x
        this.y = y
        this.image = new Image()
        this.image.src = imageSrc
        this.scale = scale
        this.frameAmount = frameAmount
        this.frameCurrent = 0
        this.framesPassed = 0
        this.framesHold = framesHold
        this.offset = offset
        
    }

    animateFrames(){
        this.framesPassed++
        if(this.framesPassed % this.framesHold == 0){
            if(this.frameCurrent < this.frameAmount - 1){
                this.frameCurrent++
            }else{
                this.frameCurrent = 0
            }
        } 
    }

    draw(){
        c.imageSmoothingEnabled = false
        c.drawImage(
            this.image,
            this.frameCurrent * (this.image.width/this.frameAmount),
            0,
            this.image.width/this.frameAmount,
            this.image.height,
            this.x - this.offset.x, 
            this.y - this.offset.y, 
            (this.image.width/this.frameAmount) * this.scale, 
            this.image.height * this.scale
        )
    }

    update(){
        this.draw()
        this.animateFrames()
    }
}

class player extends Sprite{
    constructor (width, height, x, y, keyRight, keyLeft, keyJump, keyDown, keyAttack, keyBlock, isFlipped, imageSrc, framesHold, scale = 1, frameAmount = 1, offset, sprites) {

    super(x, y, imageSrc, framesHold, scale, frameAmount, offset)

    this.width = width
    this.height = height
    this.speedX = 0
    this.speedY = 0
    this.gravity = 0.4
    this.isAttacking = false
    this.isBlocking = false
    this.canBlock = true
    this.isFlipped = isFlipped
    this.isHit = false
    this.canMove = true
    this.health = 1000
    this.damage = 0
    this.attackInputs = []
    this.knockbackSpeed = 0
    this.lastKey = ""
    this.attackForceY = 0
    this.frameCurrent = 0
    this.sprites = sprites

    this.keys = {
        right: {key: keyRight, isPressed: false},
        left: {key: keyLeft, isPressed: false},
        up: {key: keyJump, isPressed: false},
        down: {key: keyDown, isPressed: false},
        attack: {key: keyAttack, isPressed: false},
        block: {key: keyBlock, isPressed: false}
    }

    this.attackBox = {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        xOffset: 0,
        yOffset: 0,
        followPlayer: false
    }

    for (const sprite in this.sprites){
        sprites[sprite].image = new Image()
        sprites[sprite].image.src = sprites[sprite].imageSrc
    }
}
    drawHitboxes(){
        // Player hitbox
        c.fillStyle = "red"
        c.fillRect(this.x, this.y, this.width, this.height)

        //Attack hitbox
        c.fillStyle = "green"
        
        if(this.attackBox.followPlayer == true){
            c.fillRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height)
        }
    }
    attackMid(){
        this.damage = 80
        this.changeAnimation(this.sprites.atkMid, this.sprites.atkMidFlip)
        if(this.isFlipped == false){
            this.attack(this, 20, 0, 120, this.height, 10, 10, 0)
        }else{
            this.attack(this, this.width-120-20, 0, 120, this.height, 10, 10, 0)
        }   
    }
    attackJumpUppercut(){
        this.damage = 100
        this.changeAnimation(this.sprites.atkUpcut, this.sprites.atkUpcutFlip)
        if(this.isFlipped == false){
            this.attack(this, 15, -20, 150, this.height + 90, 25, 25, -10)
        }else{
            this.attack(this, this.width-120-15, -20, 150, this.height + 90, 25, 25, -10)
        }    
    }
    attackJumpLow(){
        this.damage = 50
        this.changeAnimation(this.sprites.atkJLow, this.atkJLowFlip)
        if(this.isFlipped == false){
            this.attack(this, -40, this.height/2, 200, 80, 10, 10, 0)
        }else{
            this.attack(this, this.width-200+40, this.height/2, 200, 80, 10, 10, 0)
        }    
    }
    attackLow(){
        this.damage = 60
        this.changeAnimation(this.sprites.atkLow, this.sprites.atkLowFlip)
        if(this.isFlipped == false){
            this.attack(this, -30, this.height-70, 250, 60, 10, 15, -6)
        }else{
            this.attack(this, this.width + 50 - 250, this.height-70, 250, 60, 10, 15, -6)
        } 
    }
    resetAttackBox(player, enemy){
        player.attackBox.followPlayer = false
        player.isAttacking = false
        enemy.isHit = false
        player.attackBox.x = 0
        player.attackBox.y = 0
        player.attackBox.width = 0
        player.attackBox.height = 0
        player.damage = 0
    }
    attack(player, xOffset, yOffset, width, height, delayFrames, durationFrames, forceY){
        //Checks who is performing attack and who is being attacked
        let enemy = player2
        if(player == player2){
            enemy = player1
        }
        player.isAttacking = true
    
        setTimeout(function(player){
            if (player.canMove == true){
                player.attackBox.xOffset = xOffset
                player.attackBox.yOffset = yOffset
                player.attackBox.followPlayer = true
                player.attackBox.height = height
                player.attackBox.width = width
                player.attackForceY = forceY
            } 
        }, (1000*delayFrames)/60, player)
        setTimeout(this.resetAttackBox, (1000*(durationFrames+delayFrames))/60, player, enemy)    
    }
    block(player){
        if(player.canBlock == true){
            player.isBlocking = true
            player.canBlock = false
            player.canMove = false
            setTimeout(function(){
                player.canMove = true
                player.isBlocking = false
                setTimeout(function(){
                    player.canBlock = true
                }, 500)
            }, (1000*(20)/60))
        }  
    }
    changeAnimation(sprite, spriteFlipped){
        if(this.isFlipped == false){
            this.changeSprite(sprite)
        }else{
            this.changeSprite(spriteFlipped)
        }
    }
    changeSprite(sprite){
        if(this.image.src != sprite.image.src && this.isAttacking == false && this.isBlocking == false){
            this.frameCurrent = 0
            this.frameAmount = sprite.frameAmount
            this.framesHold = sprite.framesHold
            this.image = sprite.image
        }
    }
    update(){
        //Check if attack hitbox should follow player
        if(this.attackBox.followPlayer == true){
            this.attackBox.x = this.x + this.attackBox.xOffset
            this.attackBox.y = this.y + this.attackBox.yOffset
        }

        // this.drawHitboxes()
        this.draw()
        this.animateFrames()

        this.x += this.speedX
        this.y += this.speedY

        //gravity
        if (this.y + this.height >= canvas.height){
            this.speedY = 0
        }else{
            this.speedY += this.gravity
        }

        //Check contact with wall
        if (this.x <= 0){
            this.speedX = 0
        }
        else if(this.x + this.width >= canvas.width){
            this.speedX = 0
        }

        //Check for knockback
        if (this.knockbackSpeed == this.speedX && this.speedX != 0){
            if (this.knockbackSpeed > 0){
                this.knockbackSpeed -= 0.4
                this.speedX -= 0.4
            }else if(this.knockbackSpeed < 0){
                this.speedX += 0.4
                this.knockbackSpeed += 0.4
            }
        } else {
            this.knockbackSpeed = 0
            this.speedX = 0
        }
    }
}

let player1 = new player(
    90, 150, 300, 100, 
    "d", "a", "w", "s", " ", "q", false, "images/stabby-pete-idle.png", 20, 5, 3, {x: 105, y: 91}, 
    {
        idle: {imageSrc: "images/stabby-pete-idle.png", frameAmount: 3, framesHold: 20},
        idleFlip: {imageSrc: "images/stabby-pete-idle-flip.png", frameAmount: 3, framesHold: 20},
        run: {imageSrc: "images/sp-walk.png", frameAmount: 2, framesHold: 6},
        runFlip: {imageSrc: "images/sp-walk-flip.png", frameAmount: 2, framesHold: 6},
        jump: {imageSrc: "images/sp-jump.png", frameAmount: 3, framesHold: 6},
        jumpFlip: {imageSrc: "images/sp-jump-flip.png", frameAmount: 3, framesHold: 6},
        atkMid: {imageSrc: "images/sp-stab.png", frameAmount: 5, framesHold: 6},
        atkMidFlip: {imageSrc: "images/sp-stab-flip.png", frameAmount: 5, framesHold: 6},
        atkLow: {imageSrc: "images/sp-low-slice.png", frameAmount: 7, framesHold: 6},
        atkLowFlip: {imageSrc: "images/sp-low-slice-flip.png", frameAmount: 7, framesHold: 6},
        atkJLow: {imageSrc: "images/sp-j-low.png", frameAmount: 5, framesHold: 6},
        atkJLowFlip: {imageSrc: "images/sp-j-low-flip.png", frameAmount: 5, framesHold: 6},
        atkUpcut: {imageSrc: "images/sp-upcut.png", frameAmount: 8, framesHold: 6},
        atkUpcutFlip: {imageSrc: "images/sp-upcut-flip.png", frameAmount: 8, framesHold: 6},
    }
    )
let player2 = new player(
    90, 150, 800, 100,  
    "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "j", "k", true, "images/stabby-pete-idle-flip.png", 10, 5, 3, {x: 125, y: 91},
    {
        idle: {imageSrc: "images/stabby-pete-idle.png", frameAmount: 3, framesHold: 20},
        idleFlip: {imageSrc: "images/stabby-pete-idle-flip.png", frameAmount: 3, framesHold: 20},
        run: {imageSrc: "images/sp-walk.png", frameAmount: 2, framesHold: 6},
        runFlip: {imageSrc: "images/sp-walk-flip.png", frameAmount: 2, framesHold: 6},
        jump: {imageSrc: "images/sp-jump.png", frameAmount: 3, framesHold: 6},
        jumpFlip: {imageSrc: "images/sp-jump-flip.png", frameAmount: 3, framesHold: 6},
        atkMid: {imageSrc: "images/sp-stab.png", frameAmount: 5, framesHold: 6},
        atkMidFlip: {imageSrc: "images/sp-stab-flip.png", frameAmount: 5, framesHold: 6},
        atkLow: {imageSrc: "images/sp-low-slice.png", frameAmount: 7, framesHold: 6},
        atkLowFlip: {imageSrc: "images/sp-low-slice-flip.png", frameAmount: 7, framesHold: 6},
        atkJLow: {imageSrc: "images/sp-j-low.png", frameAmount: 5, framesHold: 6},
        atkJLowFlip: {imageSrc: "images/sp-j-low-flip.png", frameAmount: 5, framesHold: 6},
        atkUpcut: {imageSrc: "images/sp-upcut.png", frameAmount: 8, framesHold: 6},
        atkUpcutFlip: {imageSrc: "images/sp-upcut-flip.png", frameAmount: 8, framesHold: 6},
    }
    )

function gameLoop(){
    c.clearRect(0, 0, canvas.width, canvas.height)
    window.requestAnimationFrame(gameLoop)

    updateUI()

    checkPlayerCrossed()
    checkCollisionIfAttacking()
    
    storeKeyboardInputs()

    if(player1.canMove == true){
        playerMovement(player1)
        playerAttacks(player1) 
    }
    if(player2.canMove == true){
        playerMovement(player2)
        playerAttacks(player2) 
    }

    player1.update()
    player2.update()

    checkGameOver()
}

function playerAttacks(player){
    // Attacks
    if(player.isAttacking == false && player.attackInputs.length != 0){
        if(listMatchList(player.attackInputs, [player.keys.down.key, player.keys.attack.key]) == true && player.y + player.height * 1.5 <= canvas.height){
            player.attackJumpLow()
        }
        else if(listMatchList(player.attackInputs, [player.keys.down.key, player.keys.attack.key]) == true){
            player.attackLow()
        }
        else if(listMatchList(player.attackInputs, [player.keys.attack.key]) == true){
            player.attackMid()
        }
        else if(listMatchList(player.attackInputs, [player.keys.up.key, player.keys.attack.key])){
            player.attackJumpUppercut()
        }
    } 

    // Block
    if(player.keys.block.isPressed == true){
        player.block(player)
    }
}

function playerMovement(player){
    // Left and right
    if (player.keys.left.isPressed == true && player.lastKey == player.keys.left.key && player.x > 0){
        player.speedX = -6
        if (player.speedY == 0)
        player.changeAnimation(player.sprites.run, player.sprites.runFlip)
    }
    else if (player.keys.right.isPressed == true && player.lastKey == player.keys.right.key && player.x + player.width < canvas.width){
        player.speedX = 6
        if (player.speedY == 0)
        player.changeAnimation(player.sprites.run, player.sprites.runFlip)
    } else {
        if (player.speedY == 0)
        player.changeAnimation(player.sprites.idle, player.sprites.idleFlip)
    }

    // //Check if jumping to change animation
    // if(player.speedY < 0){ 
    //     player.changeAnimation(player.sprites.jump, player.sprites.jumpFlip)
    // } else if (player.speedY > 0){
    //     player.changeAnimation(player.sprites.jumpFlip, player.sprites.jump)
    // }
    

    // Jump
    if (player.keys.up.isPressed == true && player.y + player.height >= canvas.height){
        player.speedY -= 12
    } 
}

function checkCollisionIfAttacking(){
    if(player1.isAttacking == true){
        detectAttackCollision(player1, player2)
    }else if(player2.isAttacking == true){
        detectAttackCollision(player2, player1)
    }    
}

function detectAttackCollision(playerAttacking, enemyHit){
    if(playerAttacking.attackBox.x + playerAttacking.attackBox.width >= enemyHit.x &&
        playerAttacking.attackBox.x <= enemyHit.x + enemyHit.width && 
        playerAttacking.attackBox.y + playerAttacking.attackBox.height >= enemyHit.y &&
        playerAttacking.attackBox.y <= enemyHit.y + enemyHit.height &&
        enemyHit.isHit == false){
            
            hitEnemy(playerAttacking, enemyHit)
            setTimeout(() => {
                if(enemyHit.isHit == false)
                enemyHit.canMove = true
            }, (1000*30)/60);       
    }
}

function hitEnemy(playerAttacking, enemyHit){
    enemyHit.isHit = true
    enemyHit.canMove = false
    if(enemyHit.isBlocking == false){
        enemyHit.health -= playerAttacking.damage
        if (playerAttacking.isFlipped == false){
            applyKnockback(9, enemyHit)
        }else{
            applyKnockback(-9, enemyHit)
        }  
        enemyHit.speedY += playerAttacking.attackForceY
    }
    
}

function applyKnockback(forceX, player){
    if(forceX != 0 && player.x > 0 && player.x + player.width < canvas.width){
        player.speedX += forceX
        player.knockbackSpeed = player.speedX
    }
}

function storeKeyboardInputs(){
    // Checks players movement and puts it in an array as a string value
    changeInputList(player1, player1.keys.attack)
    changeInputList(player1, player1.keys.down)
    changeInputList(player1, player1.keys.up)
    changeInputList(player2, player2.keys.attack)
    changeInputList(player2, player2.keys.down)
    changeInputList(player2, player2.keys.up)
}

function changeInputList(player, key){
    if(key.isPressed == true && isInList(player.attackInputs, key.key) == false){
        player.attackInputs.push(key.key)
    }else if (key.isPressed == false && isInList(player.attackInputs, key.key) == true){
        player.attackInputs.splice(player.attackInputs.indexOf(key.key), 1)
    } 
}

function isInList(list, item){
    for (let i = 0; i <= list.length; i++) {
        if(item == list[i]){
            return true
        }
    }
    return false
}

function listMatchList(list1, list2){
    let longerList = list1
    let shorterList = list2
    if(list1.length < list2.length){
        longerList = list2 
        shorterList = list1
    }
    for (let i = 0; i <= longerList.length; i++) {
        if(isInList(shorterList, longerList[i]) == false){
            return false
        }
    }
    return true
}

function checkPlayerCrossed(){
   if(player1.x + player1.width/2 > player2.x + player2.width/2 && 
   player1.isFlipped == false && player2.isFlipped == true){
       player1.isFlipped = true
       player2.isFlipped = false

   }else if(player1.x + player1.width/2 < player2.x + player2.width/2 && 
   player1.isFlipped == true && player2.isFlipped == false){
       player1.isFlipped = false
       player2.isFlipped = true
   }
}

function checkGameOver(){
    if(gameOver == false)
        if(gameTime <= 0 || player1.health <= 0 || player2.health <= 0){

            gameOver = true
            clearInterval(IDgameTimer)

            player1.canMove = false
            player2.canMove = false

            if(gameTime <= 0){
                console.log("draw")   
            }else if(player1.health <= 0){
                player1.health = 0
                console.log("Player 2 wins")
            }else if(player2.health <= 0){
                player2.health = 0
                console.log("player 1 wins")
            }
        }
}

IDgameTimer = setInterval(function(){
    gameTime--
}, 1000);

gameLoop()

document.addEventListener("keydown", function(event){
    checkKeyDown(event, player1)
    checkKeyDown(event, player2)
})

function checkKeyDown(event, player){
    switch (event.key){
        case player.keys.right.key:
            player.keys.right.isPressed = true
            player.lastKey = player.keys.right.key
            break
        case player.keys.left.key:
            player.keys.left.isPressed = true
            player.lastKey = player.keys.left.key
            break
        case player.keys.up.key:
            player.keys.up.isPressed = true
            break
        case player.keys.attack.key:
            player.keys.attack.isPressed = true
            break
        case player.keys.down.key:
            player.keys.down.isPressed = true
            break
        case player.keys.block.key:
            player.keys.block.isPressed = true
            break
        }
}

document.addEventListener("keyup", function(event){
    checkKeyUp(event, player1)
    checkKeyUp(event, player2)
})

function checkKeyUp(event, player){
    switch (event.key){
        case player.keys.right.key:
            player.keys.right.isPressed = false
            break
        case player.keys.left.key:
            player.keys.left.isPressed = false
            break
        case player.keys.up.key:
            player.keys.up.isPressed = false
            break
        case player.keys.attack.key:
            player.keys.attack.isPressed = false
            break
        case player.keys.down.key:
            player.keys.down.isPressed = false
            break
        case player.keys.block.key:
            player.keys.block.isPressed = false
            break
    }
}

// UI / HTML ----------------------------------------------------------------------------

function updateUI(){
    healthbarPlayer1.innerHTML = player1.health
    healthbarPlayer2.innerHTML = player2.health
    gameTimer.innerHTML = gameTime
}