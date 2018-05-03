
var request     =   require('sync-request');
var cheerio     =   require('cheerio');
var fs          =   require('fs');  
var jq          =   require('jquery');
var jsdom       =   require('jsdom');
var jsonfile    =   require('jsonfile');



var get = {};



//MIT course catalog url >> CourseCatalog.html
get.CourseCatalog = function(){

    var urlCC  = 'http://student.mit.edu/catalog/index.cgi'
    var getCC  = request('GET', urlCC);
    fs.writeFileSync('Courses/CourseCatalog.html', getCC.getBody().toString());
};
//================================================================================================





//Array of Course IDs: m1a.html > 1a
get.CourseMainIDs = function(){

    var catalog = cheerio.load(fs.readFileSync('Courses/CourseCatalog.html'));
    
    var aTags  = [];
    catalog('a').each(function(index){
        var aTagHref = catalog(this).attr('href');
        aTags.push(aTagHref);
    });

    var mhtmlIDs = aTags.filter(function(a){
        if( a != undefined ){
            if(a[0] === 'm' && a.slice( a.length-5, a.length+1 ) === '.html'){
                return true;
            };
        };
    });

    var IDs = [];
    var cleanIDs = [];
    
    mhtmlIDs.forEach(function(a){
        IDs.push(a.slice( 1, a.length-5 ));
        cleanIDs.push(a.slice(1,a.length-6));
    });

    var json = JSON.stringify(cleanIDs, null, 2);

    fs.writeFileSync('CoursesJson/MainCourseID.json', json, (error) => { /* handle error */ });

    return IDs;
};
//================================================================================================



//Course [MainID] url >> CourseMainID.html
get.MainCourseCatalog = function(){

    var urlSC = [];
    var IDs   = get.CourseMainIDs();
    
    IDs.forEach(function(a){
        urlSC.push( 'http://student.mit.edu/catalog/m' + a + '.html' )
    });

    for(i = 0; i < IDs.length; i++){
        var getSC = request('GET', urlSC[i]);
        fs.writeFileSync( 'Courses/course' + IDs[i] + '.html', getSC.getBody().toString() );
    };
};
//================================================================================================





//Get rid of duplicates
get.UniqueElements = function(array){

    var unique = [array[0]];

    for(i = 0; i < array.length; i++){
        if(unique.includes(array[i]) === false ){
            unique.push(array[i]);
        };
    };

    return unique;
};
//================================================================================================





//Array of Course sub-IDs: Need to visit each url
get.CourseSubIDs = function(CourseID){
    
    var catalog = cheerio.load(fs.readFileSync( 'Courses/course' + CourseID + '.html' ));

    var aTags   = [];
    catalog('a').each(function(index){
        var aTagHref = catalog(this).attr('href');
        aTags.push(aTagHref);
    });

    //Cannot read property '0' of undefined
    var mhtmlIDs = aTags.filter(function(a){
        if( a != undefined ){
            if(a[0] === 'm' && a.slice( a.length-5, a.length+1 ) === '.html'){
                return true;
            };
        };
    });

    var IDs = [];
    mhtmlIDs.forEach(function(a){
        IDs.push( a.slice( 1, a.length-5 ) )
    });

    return get.UniqueElements(IDs);
};
//================================================================================================





//Course [SubID] url >> CourseSubID.html
get.SubCourseCatalog = function(){

    var subIDs = [];
    var mainIDs = get.CourseMainIDs();

    mainIDs.forEach(function(id){
        subIDs = subIDs.concat( get.CourseSubIDs(id) );
    })

    subIDs = subIDs.filter(function(a){
        if(a!=undefined){
            return true;
        };
    });

    subIDs.forEach(function(a){
        var subUrl = 'http://student.mit.edu/catalog/m' + a + ".html";
        var getHtml = request('GET', subUrl);
        fs.writeFileSync('Courses/course' + a + '.html', getHtml.getBody().toString() );
    })

}
//================================================================================================





//Full course IDs
get.CourseIDs = function(){

    var IDs     = [];
    var mainIDs = get.CourseMainIDs();
    var subIDs  = [];
    
    mainIDs.forEach(function(a){
        subIDs.push( get.CourseSubIDs(a) )
    })

    for(i = 0; i < mainIDs.length; i++){
        IDs.push( mainIDs[i] );
        IDs = IDs.concat( subIDs[i] )
    }

    IDs = IDs.filter(function(a){
        if( a != undefined ){
            return true;
        }
    })

    var json = JSON.stringify(IDs, null, 2);

    
    fs.writeFileSync('CoursesJson/CourseID.json', json, (error) => { /* handle error */ });
    return IDs;
};
//================================================================================================





//Course Titles
get.CourseTitles = function(CourseID){

    var catalog = cheerio.load( fs.readFileSync( 'Courses/course' + CourseID + '.html' ) );
    var h3Split = catalog('html').html().split( '<h3>' );

    var titleInfo = [];
    h3Split.forEach(function(a){
        if( a.includes('<img alt="______" src="/icns/hr.gif">') === true ){
            var temp = a.split( '\n' )[0];
            titleInfo.push(temp);
        };
    })

    return titleInfo;
}
//================================================================================================




//Course Numbers
get.CourseNumbers = function(CourseID){

    var catalog = cheerio.load( fs.readFileSync( 'Courses/course' + CourseID + '.html' ) );
    var h3Split = catalog('html').html().split( '<h3>' );


    var numbInfo = [];

    for( i = 0; i < h3Split.length; i++){
        
        var temp = h3Split[i].split( "<a name=" );

        temp = temp.filter( function(a){
            if( a.includes( '"' + CourseID.slice(0, CourseID.length-1) + '.' ) ){
                return true;
            }
        } )
        numbInfo.push(temp)
    };

    numbInfo.forEach(function(a){

        for( i = 0; i < a.length; i++){
            a[i] = a[i].split('"')[1];
        }
    })

    numbInfo = numbInfo.filter(function(a){
        if( a.length != 0 ){
            return true;
        }
    })

    return numbInfo;
}
//================================================================================================





//Course Descriptions
get.CourseDescriptions = function(CourseID){

    var catalog = cheerio.load( fs.readFileSync('Courses/course' + CourseID + '.html') );
    var brSplit = catalog('html').html().split('<a name=');

    var lineSplit = [];
    brSplit.forEach( function(a){
        if( a.includes('<img alt="______" src="/icns/hr.gif">') === true ){
            lineSplit.push(a);
        };
    });

    var courseDescriptions = [];
    lineSplit.forEach( function(a){
        var des = a.split( '<img alt="______" src="/icns/hr.gif">' )[2]
                   .split( '<br>' )[1]
                   .split('\n')[0];

        courseDescriptions.push(des);
    } )
    
    return courseDescriptions;
}
//================================================================================================





get.CourseUG = function(CourseID){

    var catalog = cheerio.load( fs.readFileSync('Courses/course' + CourseID + '.html') );

    var img = [];
    catalog('img').each(function(index){
        var imgTag = catalog(this).attr('title');
        if(imgTag === 'Undergrad' || imgTag === 'Graduate' ){
            img.push(imgTag);
        }
    })

    return img;
}
//================================================================================================




get.CourseTerm = function(CourseID){

    var catalog = cheerio.load( fs.readFileSync('Courses/course' + CourseID + '.html') );
    var term = [];

    var termsSplit = catalog('html').html().split('<a name="')
        termsSplit = termsSplit.slice(1,termsSplit.length+1);

    termsSplit.forEach(function(T){

        var findTerm = T.split('<img alt="______" src="/icns/hr.gif">')[1]
        var FISS = [];

        if(findTerm != undefined){
            if(findTerm.includes('Fall')){
                FISS.push('Fall');
            }
            if(findTerm.includes('IAP')){
                FISS.push('IAP');
            }
            if(findTerm.includes('Spring')){
                FISS.push('Spring');
            }
            if(findTerm.includes('Summer')){
                FISS.push('Summer');
            }
            term.push(FISS);
        }
    })
    
    return term;
}
//================================================================================================




get.CourseUnits = function(CourseID){

    var catalog   = cheerio.load( fs.readFileSync('Courses/course' + CourseID + '.html') )
    var unitSplit = catalog('html').html().split('<br>');

    var unit = [];
    unitSplit.forEach(function(a){
        if( a.includes('Units: ') ){
            unit.push(a.slice(7,12));
        }
        if( a.includes('Units arranged') ){
            unit.push('arranged');
        }
    })

    return unit
}
//================================================================================================




//Course data summary
get.CourseDataSummary = function(CourseID){


    var length = get.CourseTitles(CourseID).length;
    var DataSummary = [];

        for(var j=0; j<length; j++){
            var Numb  = get.CourseNumbers(CourseID)[j];
            var Title = get.CourseTitles(CourseID)[j];
            var Des   = get.CourseDescriptions(CourseID)[j];
            var UdGd  = get.CourseUG(CourseID)[j];
            var Term  = get.CourseTerm(CourseID)[j];
            var Unit  = get.CourseUnits(CourseID)[j];
            var data  = { number: Numb, title: Title, description: Des, UG: UdGd, term: Term, units: Unit};
            DataSummary.push(data);
        };


    var Data = {};
    Data['Course ' + CourseID] = DataSummary;
    
    //JSON.stringify(Data): messy long
    //JSON.stringify(Data, null, 2): clean legible
    var json = JSON.stringify(Data, null, 2);

    //without (error) => { /* handle error */ } callback
    //(node:15236) [DEP0013] DeprecationWarning: Calling an asynchronous function without callback is deprecated.
    fs.writeFile( 'CoursesJson/course' + CourseID + '.json', json, (error) => { /* handle error */ });
}


//run this to write json files
// var ID = get.CourseIDs();
// ID.forEach(function(index){
//     get.CourseDataSummary(index);
// })
//================================================================================================
get.CourseDataSummary('2a')




//console.log(get.check())
//needs to return empty array
get.check = function(){
    var courseIDs = get.CourseIDs()

    var check = [];

    courseIDs.forEach(function(a){
        var numb = get.CourseNumbers(a).length;
        var title = get.CourseTitles(a).length;
        var des = get.CourseDescriptions(a).length;

        if(des != title || title != numb || numb != des){
            check.push( [a, get.CourseNumbers(a).length, get.CourseTitles(a).length] )
        }
    })

    return check
}
//================================================================================================




