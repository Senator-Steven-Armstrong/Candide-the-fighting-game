// DECLARATION ---------------------------------------------------------------------------

const canvas = document.getElementById("game-area")
const c = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const healthbarPlayer1 = document.getElementById("player1-hp")
const healthbarPlayer2 = document.getElementById("player2-hp")
const gameTimer = document.getElementById("game-timer")
const gameOverScreen = document.getElementById("game-over")

// GAMEPLAY / CANVAS --------------------------------------------------------------------

let gameTime = 100
let gameOver = false

class Sprite{
    constructor(x, y, imageSrc, framesHold, scale = 1, frameAmount = 1, offset = {x: 0, y: 0}){
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

class Player extends Sprite{
    constructor (width, height, x, y, keyRight, keyLeft, keyJump, keyDown, keyAttack, keyBlock, isFlipped, imageSrc, framesHold, scale = 1, frameAmount = 1, offset, sprites) {

    super(x, y, imageSrc, framesHold, scale, frameAmount, offset)

    this.width = width
    this.height = height
    this.speedX = 0
    this.speedY = 0
    this.gravity = 0.4
    this.isAttacking = false
    this.isBlocking = false
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
    movement(){
        // Left and right
        if (this.keys.left.isPressed == true && this.lastKey == this.keys.left.key && this.x > 0){
            this.speedX = -6
            if (this.speedY == 0)
            this.changeAnimation(this.sprites.run, this.sprites.runFlip)
        }
        else if (this.keys.right.isPressed == true && this.lastKey == this.keys.right.key && this.x + this.width < canvas.width){
            this.speedX = 6
            if (this.speedY == 0)
            this.changeAnimation(this.sprites.run, this.sprites.runFlip)
        } else {
            this.speedX = 0
            this.changeAnimation(this.sprites.idle, this.sprites.idleFlip)
        }

        //Check if jumping to change animation
        if(this.speedY < 0){ 
            this.changeAnimation(this.sprites.jump, this.sprites.jumpFlip)
        } else if (this.speedY > 0){
            this.changeAnimation(this.sprites.fall, this.sprites.fallFlip)
        }
        

        // Jump
        if (this.keys.up.isPressed == true && this.y + this.height >= canvas.height){
            this.speedY -= 12
        } 
    }
    attacks(){
        // Attacks
        if(this.isAttacking == false && this.attackInputs.length != 0){
            if(listMatchList(this.attackInputs, [this.keys.down.key, this.keys.attack.key]) == true && this.y + this.height * 1.5 <= canvas.height){
                this.attackJumpLow()
            }
            else if(listMatchList(this.attackInputs, [this.keys.down.key, this.keys.attack.key]) == true){
                this.attackLow()
            }
            else if(listMatchList(this.attackInputs, [this.keys.attack.key]) == true){
                this.attackMid()
            }
            else if(listMatchList(this.attackInputs, [this.keys.up.key, this.keys.attack.key])){
                this.attackJumpUppercut()
            }
        } 
    
        // Block
        if(this.keys.block.isPressed == true){
            this.changeAnimation(this.sprites.block, this.sprites.blockFlip)
            this.isBlocking = true
            this.canMove = false
            this.speedX = 0
        }
    }
    applyKnockback(forceX){
        if(forceX != 0 && this.x > 0 && this.x + this.width < canvas.width){
            this.speedX += forceX
            this.knockbackSpeed = this.speedX
        }
    }
    changeAnimation(sprite, spriteFlipped = sprite){
        if(this.isFlipped == false){
            this.changeSprite(sprite)
        }else{
            this.changeSprite(spriteFlipped)
        }
    }
    changeSprite(sprite){
        if(this.image.src != sprite.image.src && this.isAttacking == false && this.isBlocking == false && gameOver == false){
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
        if (this.knockbackSpeed == this.speedX && this.speedX != 0 || this.knockbackSpeed != 0){
            if (this.knockbackSpeed > 0){
                this.knockbackSpeed -= 0.4
                this.speedX -= 0.4
            }else if(this.knockbackSpeed < 0){
                this.speedX += 0.4
                this.knockbackSpeed += 0.4
            }
        }
    }
}

class PlayerPete extends Player{

    constructor(x, y, keyRight, keyLeft, keyJump, keyDown, keyAttack, keyBlock, isFlipped){

        let width = 90
        let height = 150
        let framesHold = 20
        let scale = 5
        let frameAmount = 3
        let offset = {x: 115, y: 91}
        let imageSrc = "images/stabby pete/stabby-pete-idle.png"
        
        let sprites = {
            idle: {imageSrc: "images/stabby pete/stabby-pete-idle.png", frameAmount: 3, framesHold: 20},
            idleFlip: {imageSrc: "images/stabby pete/stabby-pete-idle-flip.png", frameAmount: 3, framesHold: 20},
            run: {imageSrc: "images/stabby pete/sp-walk.png", frameAmount: 2, framesHold: 6},
            runFlip: {imageSrc: "images/stabby pete/sp-walk-flip.png", frameAmount: 2, framesHold: 6},
            jump: {imageSrc: "images/stabby pete/sp-jump.png", frameAmount: 3, framesHold: 15},
            jumpFlip: {imageSrc: "images/stabby pete/sp-jump-flip.png", frameAmount: 3, framesHold: 15},
            atkMid: {imageSrc: "images/stabby pete/sp-stab.png", frameAmount: 5, framesHold: 6},
            atkMidFlip: {imageSrc: "images/stabby pete/sp-stab-flip.png", frameAmount: 5, framesHold: 6},
            atkLow: {imageSrc: "images/stabby pete/sp-low-slice.png", frameAmount: 7, framesHold: 6},
            atkLowFlip: {imageSrc: "images/stabby pete/sp-low-slice-flip.png", frameAmount: 7, framesHold: 6},
            atkJLow: {imageSrc: "images/stabby pete/sp-j-low.png", frameAmount: 5, framesHold: 6},
            atkJLowFlip: {imageSrc: "images/stabby pete/sp-j-low-flip.png", frameAmount: 5, framesHold: 6},
            atkUpcut: {imageSrc: "images/stabby pete/sp-upcut.png", frameAmount: 8, framesHold: 6},
            atkUpcutFlip: {imageSrc: "images/stabby pete/sp-upcut-flip.png", frameAmount: 8, framesHold: 6},
            block: {imageSrc: "images/stabby pete/sp-block.png", frameAmount: 1, framesHold: 60},
            blockFlip: {imageSrc: "images/stabby pete/sp-block-flip.png", frameAmount: 1, framesHold: 60},
            fall: {imageSrc: "images/stabby pete/sp-fall.png", frameAmount: 2, framesHold: 5},
            fallFlip: {imageSrc: "images/stabby pete/sp-fall-flip.png", frameAmount: 2, framesHold: 5},
            hit: {imageSrc: "images/stabby pete/sp-hit.png", frameAmount: 1, framesHold: 60},
            hitFlip: {imageSrc: "images/stabby pete/sp-hit-flip.png", frameAmount: 1, framesHold: 60},
            win: {imageSrc: "images/stabby pete/sp-buss-it.png", frameAmount: 10, framesHold: 2}
        }

        super(width, height, x, y, keyRight, keyLeft, keyJump, keyDown, keyAttack, keyBlock, isFlipped, imageSrc, framesHold, scale, frameAmount, offset, sprites)
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
        this.changeAnimation(this.sprites.atkJLow, this.sprites.atkJLowFlip)
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
}

let player1 = new PlayerPete(200, 100, "d", "a", "w", "s", " ", "e", false, "images/stabby pete/stabby-pete-idle.png")

let player2 = new PlayerPete(canvas.width - 290, 100,  "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "j", "k", true, "images/stabby pete/stabby-pete-idle-flip.png")

function gameLoop(){
    c.clearRect(0, 0, canvas.width, canvas.height)
    window.requestAnimationFrame(gameLoop)
    
    updateUI()
    
    player1.update()
    player2.update()

    if(gameOver == false){
        checkPlayerCrossed()
        checkCollisionIfAttacking()
        
        storeKeyboardInputs()
    
        if(player1.canMove == true){
            player1.movement()
            player1.attacks() 
        }
        if(player2.canMove == true){
            player2.movement()
            player2.attacks() 
        }
    }

    checkGameOver()
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
            //Apply stronger knockback to counteract the enemy's current speedX
            if(enemyHit.speedX == 0){
                enemyHit.applyKnockback(9)
            }else{
                enemyHit.applyKnockback(9 - enemyHit.speedX)
            }
        }else{
            if(enemyHit.speedX == 0){
                enemyHit.applyKnockback(-9)
            }else{
                enemyHit.applyKnockback(-9 - enemyHit.speedX)
            }
        }  
        enemyHit.speedY += playerAttacking.attackForceY
    }
    moveHealthBar(enemyHit)
    enemyHit.changeAnimation(enemyHit.sprites.hit, enemyHit.sprites.hitFlip)
    
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

            player1.isAttacking = false
            player2.isAttacking = false

            clearInterval(IDgameTimer)

            player1.canMove = false
            player2.canMove = false

            if(gameTime <= 0){
                player1.changeAnimation(player1.sprites.win)
                player2.changeAnimation(player2.sprites.win)
                gameOverText("draw")
            }else if(player1.health <= 0){
                player1.changeAnimation(player1.sprites.idle, player1.sprites.idleFlip)
                player2.changeAnimation(player2.sprites.win)
                player1.health = 0
                gameOverText("Player 2 wins")
            }else if(player2.health <= 0){
                player1.changeAnimation(player1.sprites.win)
                player2.changeAnimation(player2.sprites.idle, player2.sprites.idleFlip)
                player2.health = 0
                gameOverText("player 1 wins")
            }
            player1.speedX = 0
            player2.speedX = 0
            player1.knockbackSpeed = 0
            player2.knockbackSpeed = 0

            gameOver = true
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
    if(gameOver == false){
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
}

document.addEventListener("keyup", function(event){
    checkKeyUp(event, player1)
    checkKeyUp(event, player2)
})

function checkKeyUp(event, player){
    if(gameOver == false){
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
                player.isBlocking = false
                player.canMove = true
                break
        }
    }
}

// UI / HTML ----------------------------------------------------------------------------

function updateUI(){
    gameTimer.innerHTML = gameTime
}

function gameOverText(text){
    gameOverScreen.innerHTML = text
}

function moveHealthBar(enemyHit){
    //Player max hp will by default be 1000
    procent = (1000 - enemyHit.health)/1000
    moveAmountPlayer1 = returnProcentage(procent)
    moveAmountPlayer2 = returnProcentage(-procent)
    if(enemyHit == player1){
        console.log("hit player 1")
        healthbarPlayer1.style.marginLeft = moveAmountPlayer1
    }else if(enemyHit == player2){
        console.log("hit player 2")
        healthbarPlayer2.style.marginLeft = moveAmountPlayer2
    }
}

function returnProcentage(num){
    procentage = num*100
    string = procentage.toString() + "%"
    return string
}