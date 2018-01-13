let hasValidRequestBody = function(request, requiredKeys) {
    let body = request && request.body;
    if (Array.isArray(requiredKeys)) {
      let _requiredKeys = {}
      requiredKeys.forEach(function(value){
        _requiredKeys[value] = true
      })
      requiredKeys = _requiredKeys
    }

    let match = Object.keys(requiredKeys).filter(function(key){
      var test = requiredKeys[key]
      if (typeof test === 'function') {
        return test(body[key])
      } else if (test.test) {
        return test.test(body[key])
      } else if (test === true) {
        return body[key] && body.hasOwnProperty(key)
      } else {
        return false
      } 
    })

    return match.length === Object.keys(requiredKeys).length;
}

module.exports = {
    getCollectionByKey: function(key, url, request, database ){
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
      return !!(request && request.body && request.body.username && Object.keys(knownUsers).indexOf(request.body.username) >= 0);
    }
}