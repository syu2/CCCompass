var job = {}

var KeyWords = {};
KeyWords['iteration0'] = {};
KeyWords['iteration0']['0'] = ["science", "data", "great data", "management", "big", "analytics", "machine", "learning", "python", "visualization", "deep", "data"];
KeyWords['iteration0']['1'] = ["agile", "c#", "c++", "collaborate", "team", "code", "java", ".net", "mobile", "software", "solution", "solutions", "projects", "sql", "team", "development", "design", "web", "testing"]
KeyWords['iteration0']['2'] = ["phd", "research", "cell", "biochemistry", "biology", "biophysics", "biomolecular", "calorimetry", "spectroscopy", "protein", "analysis"]

var IDs = [
    671112765, //01 Shyft, Solution Developer, Entry level
    592120017, //02 Geiko, Entry Level Software Developer, Entry level
    611776321, //03 Deutsche Bank, Java Developer, Entry level
    644589134, //04 Wayfair, Data Scientist PhD, Entry level
    610433771, //05 AWS, Data Scienctist, na
    597934372, //06 Adobe, Data Scientist, Entry level
    623266739, //07 State Street, Quantitative Analyst, na
    649381579, //08 Fidelity, Quantitative Developer, Associate
    632531333, //09 Novartis, Proteomics Research Scientist, Associate
    632532043, //10 Novartis, Scientific Associate II - Biochemistry/Biophysics
    632532499, //11 Novartis, Scientific Associate, Associate
    632597581, //12 McGrawHill, Platform Engineering, Director
    629866611, //13 New York Times, Data Scientist
    629691619, //14 Illumina, Machine Learning AI Engineer
    670036417, //15 Cisco, Machine Learning Engineer
    593671734, //16 Mashing Inc, Deep Learning Engineer
    604090266, //17 Amazon, Machine Learning Engineer
    638387431, //18 Bose, Software Automation Engineer
    573124744, //19 Comcast, Test Engineerg 
    662976125  //20 Citi, Quantitative Analyst
];

//output: text blob
job.getJS = function(jobID, property){
    //property: companyName, jobTitle, jobDescription

    var jobID = 'job' + jobID.toString();
    jobID = eval(jobID);

    if(property === 'companyName'){
        var txt = 'com.linkedin.voyager.jobs.JobPostingCompany'
        var compname = jobID.companyDetails[txt].companyResolutionResult.name
        return compname;
        // console.log(compname);
    }
    if(property === 'jobTitle'){
        return jobID.title;
        // console.log(jobID.title);
    }
    if(property === 'jobDescription'){
        return jobID.description.text;
        // console.log(jobID.description.text);
    }

};

//========================================================
//========================================================

job.UniqueElements = function(array){

    var unique = [array[0]];
    for(i = 0; i < array.length; i++){
        if(unique.includes(array[i]) === false){
            unique.push(array[i]);
        };
    };
    return unique;
};

//output: counts = {keyword: #occurance, repeat: [repeated keywords]}
job.FindRepeated = function(array){

    var counts = {};
    array.forEach(function(a){ counts[a] = (counts[a] || 0) + 1 });

    var unique = job.UniqueElements(array);
    var repeat = [];
    unique.forEach(function(a){
        if(counts[a] > 1){
            repeat.push(a);
        }
    })    
    counts.repeat = repeat;

    return counts;
}

//max element
job.max = function(array){
    var max = 0;
    array.forEach(function(a){
        if( max >= a ){
            max = max;
        }
        if( max <= a ){
            max = a;
        }
    })
    return max
}

job.Key = function(jobID){

    var text = job.getJS(jobID, 'jobDescription');

    var splitLine   = text.split('\n');
    var splitPeriod = splitLine.reduce(function(prev, curr){return prev.concat(curr.split('. ')) }, []);
    var splitComma  = splitPeriod.reduce(function(prev,curr){return prev.concat(curr.split(', '))}, []);

    var junck = ['', 'the', 'is', 'an', 'only', 'new', 'york', 'a', 'of', 'your', 'this', 'that', 'its', 'seeks', 'other', 'in', 'aid', 'at', 'between', 'and', 'also', 'up', 'to', 'with', 'for', 'to', 'will', 'such', 'as', 'or', 'are', 'for', 'from', 'help'];

    var split = [];
    splitComma.forEach( a => split.push(a.split(' ')))

    var clean = [];
    split.forEach(function(array){
        var subClean = [];
        array.forEach(function(key){
            if(junck.includes(key.toLowerCase()) === false){
                subClean.push(key);
            }
        })
        clean = clean.concat(subClean);
    })

    // console.log(clean)
    return clean;
}

job.CommonKey = function(keyArrayA, keyArrayB){

    var commonKey = [];

    keyArrayA.forEach(function(a){
        if(keyArrayB.includes(a) && a.includes('undefined') === false){
            commonKey.push(a);
        }
    })

    //return jobs.UniqueElements(commonKey);
    return commonKey;
}

//========================================================
//========================================================

job.Weight = function(jobID, clusterKey){

    var commonKeys = job.CommonKey(job.Key(jobID), clusterKey);

    var uniqueWeight = job.UniqueElements(commonKeys).length*0.25;

    var repeatKeys = job.FindRepeated(commonKeys).repeat;
    var repeatWeight = repeatKeys.reduce(function(prev, curr){
        var currVal = job.FindRepeated(commonKeys)[curr]*2;
        return prev + currVal;
    }, 0)

    return uniqueWeight + repeatWeight;
}

job.knm = function(jobsArray, clusterKeys){

    //initiate cluster
    cluster0 = clusterKeys['0'];
    cluster1 = clusterKeys['1'];
    cluster2 = clusterKeys['2'];

    //initial weigh
    weights = {};

    jobsArray.forEach(function(id){
        var d = [job.Weight(id, cluster0), job.Weight(id, cluster1), job.Weight(id, cluster2)];
        weights[id] = d;
    })

    //find maximums
    assignment = {totalWeight: 0};

    jobsArray.forEach(function(id){
        var maxWeight = job.max(weights[id]);
        assignment.totalWeight += maxWeight;
        var index = weights[id].indexOf(maxWeight);
        assignment[id] =  index;
    })

    clusterCount = {};
    clusterJobIDs = {cluster0:[], cluster1:[], cluster2:[]};
    jobsArray.forEach(function(a){
        var clusterID = 'cluster' + assignment[a];
        clusterCount[clusterID] =  (clusterCount[clusterID] || 0) + 1;
        clusterJobIDs[clusterID].push(a);
        //console.log(clusterJobIDs);
    });

    return {'weight': weights,
            'assignment': assignment,
            'clusterCount' : clusterCount,
            'clusterJobIDs' : clusterJobIDs};
}

//input: ([arry of ID], number)
job.CentroidKey = function(){

    //collect all arguments
    var args = [];
    for(var i of arguments){
        args.push(i);
    };
    tol = args[1];
    args = args[0];

    var idKey = {}; //id: [arry of keys]
    var allKey = []; //[joint keys]

    args.forEach(function(id){
        var getKeys = job.Key(id);
        idKey[id] = getKeys
        allKey = allKey.concat(getKeys)
    })

    allKey = job.UniqueElements(allKey);

    //keys that appear in multiple job descriptions
    var clusterKey = [];
    allKey.forEach(function(a){
        checkIncludes = [];
        args.forEach(function(id){
            if(idKey[id].includes(a)){
                checkIncludes.push('true');
            }
        })
        if(checkIncludes.length > tol){
            clusterKey.push(a);
        }
    })

    return clusterKey;
    //return args;
}