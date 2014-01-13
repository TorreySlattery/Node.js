var count = 0;

//This is a seriously ghetto binary serach algorithm, but it works
//with my duct-taped JS
function contains(staticsArray, startX, startY, endX, endY, collidable){
    count++;
    // console.log(startX, startY, endX, endY);

    var spacing = 40;//The problem is that ..X and ..Y are in array indices, so we need to fluff those out to pixels

    var topLeftX = startX*spacing; 

    var topRightX = endX*spacing+spacing; 

    var bottomLeftY = endY*spacing+spacing;

    var bottomRightX = endX*spacing+spacing;
    var bottomRightY = endY*spacing+spacing;

    var halfX = Math.floor(endX/2);
    var halfY = Math.floor(endY/2);

    if((endX - startX < 2) || (endY - startY < 7)){
        //The larger of the two booleans determines the limit of our stack size
        return false;   
    }


    if(topLeftX <= collidable.x &&
        topRightX >= collidable.x+collidable.width &&
        bottomLeftY >= collidable.y+collidable.height &&
        bottomRightX >= collidable.x+collidable.width &&
        bottomRightY >= collidable.y+collidable.height){

        var containedIn = contains(staticsArray, startX, startY, halfX, halfY, collidable);
        if(!containedIn){
            containedIn = contains(staticsArray, halfX+1, startY, endX, halfY, collidable);
        }

        if(!containedIn){
            containedIn = contains(staticsArray, startX, halfY+1, halfX, endY, collidable);
        }

        if(!containedIn){
            containedIn = contains(staticsArray, halfX+1, halfY+1, endX, endY, collidable);
        }

        if(containedIn){
            return containedIn
        }else{
            var rect = {
                startX: startX,
                startY: startY,
                endX: endX,
                endY: endY
            }
            return rect;
        }
    }
    return false;
}