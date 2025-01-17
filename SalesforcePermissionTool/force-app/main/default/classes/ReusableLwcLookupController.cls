public with sharing class ReusableLwcLookupController {
   @AuraEnabled
   public static List<sobject> findRecords(String searchKey, String objectName, Boolean customSearchField, Boolean customSearchObject) { 
      try {
            string query=Null;
            System.debug('Inputs Apex::search key::'+searchKey+'::'+objectName+'::'+customSearchField+'::'+customSearchObject);
            IF(objectName=='User'){
                  string searchText ='\'%' + String.escapeSingleQuotes(searchKey) + '%\''; 
                  query = 'SELECT Id, Name FROM ' +objectName+ ' WHERE Name LIKE '+searchText+'AND IsActive = true LIMIT 7';
            }else if(customSearchField == true){
                  string searchText ='\'%' + String.escapeSingleQuotes(searchKey) + '%\''; 
                  query = 'select QualifiedApiName, MasterLabel from FieldDefinition where EntityDefinition.QualifiedApiName =\''+objectName+'\' AND MasterLabel LIKE '+searchText+' order by MasterLabel limit 7';
            }else if(customSearchObject == true){
                  string searchText ='\'' + String.escapeSingleQuotes(searchKey) + '%\''; 
                  query = 'select  QualifiedApiName, MasterLabel  from EntityDefinition  where ( not MasterLabel like \'%__MISSING LABEL__%\') and IsEverCreatable = true and IsEverDeletable = true AND PublisherId != \'CDC\' AND IsEverUpdatable = true AND  MasterLabel LIKE '+searchText+' order by MasterLabel limit 7';
            }else {
                  string searchText = '\'%' + String.escapeSingleQuotes(searchKey) + '%\''; 
                  query = 'SELECT Id, Name FROM ' +objectName+ ' WHERE Name LIKE '+searchText+' LIMIT 7';
            }
            System.debug('CSK:'+query);
            return Database.query(query);
            
      } catch (Exception e) {
            System.debug('CSK Error::'+e.getMessage()+':Line No:'+e.getLineNumber());
            throw new AuraException('Error Apex');
      }
   }
}