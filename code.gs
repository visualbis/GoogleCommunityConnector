function getAuthType() {
  var response = {type: 'NONE'};
  return response;
}
function getConfig() {
   var cc = DataStudioApp.createCommunityConnector();
  var config = cc.getConfig();
  console.log("config reached");
    
     config.newInfo()
      .setId('Instructions')
     .setText('Enter the API Endpoint which is accessible over Internet.'+'\n'+'GET methods Only.');


     config.newTextInput()
      .setId('endpoint')
      .setName('Enter API endpoint.')
     .setHelpText('for example: "https://newsapi.org/v2/top-headlines?country=us&apiKey=<API_KEY>"')
     .setPlaceholder('https://example.com/v2/api/')
      .setAllowOverride(true);
      config.newTextInput()
      .setId('path')
      .setName('Enter path string.')
      .setHelpText('for example: "data.employees.employee')
      .setPlaceholder('data.employees.employee')
      .setAllowOverride(true);
     config.newInfo()
      .setId('Instruction')
     .setText('Note: The given report template is used the Sample API endpoint ("https://reqres.in/api/users") and Path String as "data". ');
   config.setDateRangeRequired(true);
  
  return config.build();
  
}

function isAdminUser(){ return true }

function getSchema(request) {
    return { schema: getFields(request).build() }
}
function apiGET(url){
var params = {muteHttpExceptions:true};
  var result = UrlFetchApp.fetch(url,params);
  return result
}
function getFields(request) {
    console.log("field started");
    var cc = DataStudioApp.createCommunityConnector();
    var fields = cc.getFields();
    var types = cc.FieldType;
    var aggregations = cc.AggregationType;
    var response = apiGET(request.configParams.endpoint);
    var json = response.getContentText();
    var parsedResponse = JSON.parse(json);
    var fieldfound=[];
    var path = request.configParams.path;
    if(path !=null){
    var res = path.split('.').reduce(function(o, k) {
     return o && o[k];
     }, parsedResponse);
    
   // console.log(JSON.stringify(res));
    if(Array.isArray(res)){
      
      for(var key in res){
        
        if(!Array.isArray(res[key])){
          
          if(typeof res[key] =="object"){
            
            for(var k in res[key]){
              
              console.log("k: "+k)
              if(!Array.isArray(k)){
                //JSONObject
                //console.log(key+" " +JSON.stringify(k));
                var value = k;
                if(fieldfound.indexOf(k)==-1){
                  fieldfound.push(k)
                  console.log(fieldfound)
                  if (isDate(value)){
                    fields.newDimension()
                    .setId(k)
                    .setName(k)
                    .setType(types.YEAR_MONTH_DAY);
                  }
                  else if (typeof value == "number"){
                    fields.newMetric()
                    .setId(k)
                    .setName(k)
                    .setType(types.NUMBER);
                  }
                  else if (typeof value == "boolean") {
                    fields.newMetric()
                    .setId(k)
                    .setName(k)
                    .setType(types.BOOLEAN);
                  }
                  else {
                    fields.newDimension()
                    .setId(k)
                    .setName(k)
                    .setType(types.TEXT);  
                  }
                }
              }
              else{
                console.log("Inner ARRAY--> "+key+" " +JSON.stringify(res[key]));
                fields.newDimension()
                .setId(k)
                .setName(k)
                .setType(types.TEXT)
              }
            }
            
          }
        }
      }
    }
    
  }else{
    res =parsedResponse;
     for(var key in res){
     
    
    if(!Array.isArray(res[key])){
      //JSONObject
    // console.log(key+" " +JSON.stringify(res[key]));
      var value =res[key];
      
       if (isDate(value)){
                fields.newDimension()
                .setId(key)
                .setName(key)
                .setType(types.YEAR_MONTH_DAY);
            }
            else if (typeof value == "number"){
                fields.newMetric()
                .setId(key)
                .setName(key)
                .setType(types.NUMBER);
            }
            else if (typeof value == "boolean") {
                fields.newMetric()
                .setId(key)
                .setName(key)
                .setType(types.BOOLEAN);
            }
            else {
                fields.newDimension()
                .setId(key)
                .setName(key)
                .setType(types.TEXT);  
            }
      
    }
    else{
      console.log("ARRAY--> "+key+" " +JSON.stringify(res[key]));
      fields.newDimension()
      .setId(key)
      .setName(key)
      .setType(types.TEXT)
    }
    
  }
  }
  var fieldsFound=[];
  
 
  return fields;
}

function getData(request){
  var options = {muteHttpExceptions: true};
  var response = UrlFetchApp.fetch(request.configParams.endpoint,options);
    var json = response.getContentText();
    var parsedResponse = JSON.parse(json);
    var schema = getFields(request).build();
    var rows=[];
   var path = request.configParams.path;
  var requestedIds =request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields(request).forIds(requestedIds);
  rows = responseToRows(requestedFields,request,parsedResponse);
       
  console.log(JSON.stringify({
    schema: requestedFields.build(),
        rows: rows,
        cachedData: false,
    }))
   
   

    return {
        schema: requestedFields.build(),
        rows: rows,
        cachedData: false,
    };
   

}

function responseToRows(requestedFields,request,parsedResponse){
  
  var path = request.configParams.path;
    var rows = [];
  
if(path !=null){
    var res = path.split('.').reduce(function(o, k) {
     return o && o[k];
     }, parsedResponse);
    console.log(res);
    //
 
    if(Array.isArray(res)){
       
       for(var key in res){
         var row = {
            values: []
        };
         
        if(!Array.isArray(res[key])){
          
          if(typeof res[key] =="object"){
            
            for(var k in res[key]){
              requestedFields.asArray().forEach(function(field){
              var kk =  field.getId();
                if(kk == k){
              var value = res[key][kk];
             console.log("Inner k "+k+"  "+value );
              switch (typeof value){
                case "number":
                row.values.push(value.toString());
                break;
                case "boolean":
                row.values.push(value ? true:false);
                break;
                
               
                default:
                if(Array.isArray(value)){
                  row.values.push("object");
                }
               
                if (isDate(value)){
                    row.values.push(value.replace(/-/g, ''));
                }
                else if (value == null){
                    row.values.push(null);
                }
                  else if(typeof value =="string"){
                    row.values.push(value);
                  }
                   else{
                    row.values.push(""+value);
                break;
              }
            }
                }
            });
            }
            
          }
        }
          rows.push(row);
         console.log(rows)
       
      }
         
    }
       
 
   
  }else{
    res =parsedResponse;
    var row = {
            values: []
        };
   // for(var i =0; i<Object.keys(res).length;i++){
        
  requestedFields.asArray().forEach(function(field){
    console.log("Fields: " + field.getId());
    var value = res[field.getId()];
    console.log("Value: "+value);
     switch (typeof value){
                case "number":
                row.values.push(value.toString());
                break;
                case "boolean":
                row.values.push(value ? true:false);
                break;
                
               
                default:
                if(Array.isArray(value)){
                  row.values.push("object");
                }
               
                if (isDate(value)){
                    row.values.push(value.replace(/-/g, ''));
                }
                else if (value == null){
                    row.values.push(null);
                }
                 else{
                    row.values.push(""+value);
                 }
               
                break;
            }
   
   
  });
 
    }
    rows.push(row);

 return rows;
}


function isDate(value) {
    var dateFormat;
    if (toString.call(value) === '[object Date]') {
        return true;
    }
    if (value == false || value == null || value === true || (typeof value == "string" && !value.length) || typeof value != "string"){
        return false;
    }
    value.replace(/^\s+|\s+$/gm, '');
    dateFormat = /(^\d{1,4}[\.|\\/|-]\d{1,2}[\.|\\/|-]\d{1,4})(\s*(?:0?[1-9]:[0-5]|1(?=[012])\d:[0-5])\d\s*[ap]m)?$/;
    return dateFormat.test(value);
}
