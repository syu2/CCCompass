

var course = {};


// //fetch json data
// course.loadJSON = function(file){
//   var xobj = new XMLHttpRequest();
//   //true -> false
//   xobj.open('GET', file, false);
//   xobj.onload = function (){
//     if (xobj.readyState == 4 && xobj.status == "200") {
//       var json = JSON.parse(xobj.response)
//       return json
//     }
//   };
//   xobj.send(Int8Array);
//   return xobj.onload();
// };




//load collapsible data
course.loadCollapsible = function(){

  var smallID = CourseID.slice(0,10);

  smallID.forEach(function(id){
  //ID.forEach(function(a){
    
      var data = Course["Course " + id];

        data.forEach(function( a ){

        //undergrad/grad
        var UG = ''
        if(a.UG === 'Graduate'){UG = 'G'}
        else{UG = 'U'}

        //units
        var units = ''
        if(a.units === 'arranged'){units = '0-0-0'}
        else{units = a.units;}

        //imgtag for term
        var spanTagimg  = a.term.reduce(function(prev, curr){
          var imgTag = '<img src="Logos/' + curr + '.png"></img>'
          return prev + imgTag;
        }, '')

            spanTagimg   = '<span class = "logoContainer">' + spanTagimg + '</span>';

        var spanTagtxt   = '<span style = "float:right; font-weight:bold">' + units + ' | ' + UG + '</span>';

        var spanTag      = spanTagtxt + spanTagimg;

        var buttonTag    = '<button class="collapsible">' + a.title + spanTag + '</button>';
        //buttonTag = '<button id = "pin"><img src = "Logos/pin.png"></img></button>' + buttonTag
        $("body#Courses").append( buttonTag );

        var divTag = '<div class="content"> <p> ' + a.description + ' </p> </div>'
        $("body#Courses").append( divTag )

      });
    });
};
    // //title in button
    // data[prop].forEach(function( a ){
    // var buttonTag = document.createElement("button");
    // buttonTag.setAttribute("class", "collapsible");
    // buttonTag.setAttribute("style", "text-align:left");
    // buttonTag.innerHTML = a.title;

    // //class properties span right align
    // // var spanTag = document.createElement("span")
    // // spanTag.setAttribute("style", "float:right")
    // // span.innerHTML = a.UG;
    // // buttonTag.appendChild(spanTag);

    // var bodyTag = document.getElementById("Courses");
    // bodyTag.appendChild(buttonTag);

    // var divTag = document.createElement("div");
    // divTag.setAttribute("class", "content");

    // var pTag = document.createElement("p");
    // pTag.innerHTML = a.description;


    // divTag.appendChild(pTag);
    // bodyTag.appendChild(divTag);
    // })





//collapsible button
course.Collapsible = function(){

  var coll = document.getElementsByClassName("collapsible");

  for (var i = 0; i < coll.length; i++) {
      coll[i].addEventListener("click", function() {
      this.classList.toggle("active");

      var content = this.nextElementSibling;

      if (content.style.maxHeight){
          content.style.maxHeight = null;
      } else {
          content.style.maxHeight = content.scrollHeight + "px";
      } 
    });
  }

};



//search button
course.Search = function(){

  var input   = document.getElementById("input").value.toUpperCase();
  console.log("(clicked SEARCH) input: " + input);
  
  var keyword = input.split(' ');

  var title   = document.getElementsByClassName("collapsible")
  var length  = title.length;
  var des     = document.getElementsByTagName("p");

  var check = function(keyArray, textBlob){
    return keyArray.every( key => textBlob.innerHTML.toUpperCase().indexOf(key) > -1)
  }

  var active= []; 
  $("button#term.active").each(function(index){
    if($(this).html().includes("img")){
      active.push($("img", this).attr("src"));
    }else{
      active.push($(this).text());
    }
  })
  console.log("(clicked SEARCH) active: " + active);
 
  var countTitles = 0;
  for (var i = 2; i < title.length; i++) {
    
    var hasKey = (check(keyword, title[i]) || check(keyword, des[i]));
    var hasLogo = active.reduce(function(prev,curr){
      if(curr === undefined){
        console.log(curr.innerHTML)
      }
      if(curr.includes("Logos")){
        //logo term filter
        curr = title[i].innerHTML.includes(curr);
      }else{
        //UG
        curr = curr.includes(title[i].innerHTML.split(' | ')[1][0]);
      }
      return prev && curr;
    }, true);


    if(input = '' && hasLogo === true){
      title[i].style.display = "";
      countTitles = countTitles + 1;
    }else if( hasKey === true && hasLogo === true ) {
        //show
        title[i].style.display = "";
        countTitles = countTitles + 1;
    } else {
        //hide
        title[i].style.display = "none";
    }
  }
  console.log('number of courses listed: ' + countTitles);
  console.log('=================================================================');

  
  // for (i = 1; i < title.length; i++) {
  //     if ( (check(keyword, title[i]) || check(keyword, des[i])) === true ) {
  //         //show
  //         title[i].style.display = "";
  //     } else {
  //         //hide
  //         title[i].style.display = "none";
  //     }
  // }
}




//filter button
course.Filter = function(){

  var title  = document.getElementsByClassName("collapsible")
  var des    = document.getElementsByClassName("content");
  var length = title.length;

  var check = function(keyArray, textBlob){
    return keyArray.every( key => textBlob.innerHTML.toUpperCase().indexOf(key) > -1)
  }

  $("button#term").click( function( ){ 
    //if not activated yet
    if($(this).hasClass("active") === false ){
      //activate
      $(this).addClass("active")
    }else{
      //de-activate
      $(this).removeClass("active")}
    //console.log($(this).html())

    //find all active button
    var active = [];
    $("button#term.active").each(function(index){
      if($(this).html().includes("img")){
        active.push($("img", this).attr("src"));
      }else{
        active.push($(this).text());
      }
    })
    console.log('(clicked filter button): ' + active)

    //if match search key word and active button
    var countTitles = 0;
    for(var i = 2; i < length; i++){

      var input   = document.getElementById("input").value.toUpperCase();
      var keyword = input.split(' ');

      var truefalse = active.reduce(function(prev,curr){
        if(curr.includes("Logos")){
          //logo term filter
          curr = title[i].innerHTML.includes(curr);
        }else{
          //UG
          curr = curr.includes(title[i].innerHTML.split(' | ')[1][0]);
        }
        return prev && curr;
      }, true);

      if(truefalse === true && (check(keyword, title[i]) || check(keyword, des[i])) === true){
        title[i].style.display = "";
        des[i].style.display = "";
        countTitles = countTitles + 1
      }else{
        title[i].style.display = "none";
        des[i].style.display = "none";
      }

    }
    console.log('number of courses listed: ' + countTitles)
    console.log('=================================================================');
  })
}



course.SaveCourse = function(){


  $(function(){
    $.contextMenu({
        selector: '.collapsible', 
        callback: function(key, options) {
            var course = $(this).context.innerHTML.split("<span")[0];
            console.log(key + ' ' + course);

            var allSavedCourses = document.getElementsByClassName("added");

            var savedCourses = [];
            for(i = 0; i < allSavedCourses.length; i++){
              savedCourses.push(allSavedCourses[i].innerHTML)
            }

            if(key === "added" && savedCourses.includes(course) === false){
              savedCourses.push(course);
            }else if(key === "deleted" && savedCourses.includes(course) === true){
              savedCourses.splice( savedCourses.indexOf(course), 1 );
            }else if(course === undefined || (key === "deleted" && savedCourses.includes(course) === false)){
              savedCourses = savedCourses;
            }
            console.log('All Saved Courses:')
            console.log(savedCourses);
            console.log('=================================================================')

            var courseList = savedCourses.reduce(function(prev,curr){ return prev + '<button class = added>' + curr + '</button>' + '<br>'},'')
            document.getElementById("savedCourses").innerHTML =  '<p>' + courseList + '</p>' ;
        },
        items: {
            "added": {name: "Add Course", icon: "add"},
            "deleted": {name: "Delete Course", icon: "delete"}
        }
    });
    
    // $('.collapsible').on('click', function(e){
    //     console.log('clicked', this);
    // })
});
}


course.Delete = function(){

  $(function(){
    $.contextMenu({
        selector: 'button.added', 
        callback: function(key, options) {

            var deleteThis = $(this).context.innerHTML;
            console.log("deleted item: " + deleteThis)

            //all selected courses
            var allSelectedCourses = document.getElementsByClassName("added");
            var selectedCourses = [];
            for(i = 0; i < allSelectedCourses.length; i++){
              selectedCourses.push(allSelectedCourses[i].innerHTML)
            }

            var leftover = selectedCourses.splice(selectedCourses.indexOf(deleteThis), 1)
            console.log('All Saved Courses')
            console.log(selectedCourses)
            console.log('=================================================================')

            //insert under saved courses
            var courseList = selectedCourses.reduce(function(prev,curr){ return prev + '<button class = added>' + curr + '</button>' + '<br>'},'')
            document.getElementById("savedCourses").innerHTML =  '<p>' + courseList + '</p>' ;
        },
        items: {
            "delete": {name: "Delete Course", icon: "delete"}
        }
    });
    
});

}
