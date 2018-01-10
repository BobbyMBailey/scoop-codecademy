let hasValidRequestBody = function(request, requiredKeys) {
    let body = request && request.body;
    let match = requiredKeys.filter(function(value, key){
        return Object.keys(body).indexOf(value) > -1;
    })
    
    return match.length === requiredKeys.length;
}

module.exports = {
    getCollectionByKey: function(key, url, request ){
      const response = {};
  
      response.status = 200;
      response.body = {};
      response.body[key] = Object.keys(database[key])
            .map(id => database[key][id])
            .filter(entity => entity)
            .sort((entity1, entity2) => entity2.id - entity1.id);
            
      return response;
    },
    
    hasValidRequestBody: hasValidRequestBody,

    isUserAuthenticated: function(request, knownUsers) {
       return !!(request && request.body && request.body.username && knownUsers.indexOf(request.body.username) >= 0); 
    }
}