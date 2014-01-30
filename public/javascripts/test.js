function foo(){

  function bar(){
    console.log("bar")
    for (var k=0; k<10; k++){
      console.log("k:", k)
      for (var i=0; i<10; i++){
        console.log("i: ", i)
        if(i==4) return;
      }
      console.log("outside the i for loop")
    }
    console.log("outside the k for loop")
  }

  bar()
  console.log("End of foo function.")
}

foo()