public class UserFieldPermissionsAnalyzerController {

    @AuraEnabled
    public static String returnObjectNameFromRecId(String recId){
        String objectName = '';
        try{
            String myIdPrefix = String.valueOf(recId).substring(0,3);
            Map<String, Schema.SObjectType> gd =  Schema.getGlobalDescribe(); 
            for(Schema.SObjectType stype : gd.values()){
                Schema.DescribeSObjectResult r = stype.getDescribe();
                String prefix = r.getKeyPrefix();
                if(prefix!=null && prefix.equals(myIdPrefix)){
                    objectName = r.getName();
                    break;
                }
            }
        }catch(Exception e){
            System.debug(e);
        }
        return objectName;
    }


    @AuraEnabled
    public static UserFieldPermissionsAnalyzerController.PermissionDetails getPermissionDetails(String permissionType, String objectName, String userOrgLevel, String userId,String fieldName,Boolean fieldOrObj){
        try {
            String query='';
            Map<Id,PermissionWrapper> permIdPermMapUser = new Map<Id,PermissionWrapper>();
            List<PermissionWrapper> profilePermUserAssigned = new List<PermissionWrapper>();
            List<PermissionWrapper> psUserAssigned = new List<PermissionWrapper>();
            List<Id> psgAssignedList = new List<Id>(); // TO check later CSKV2

            if (fieldOrObj) {
                query = 'SELECT Id,ParentId,Parent.Name,Parent.Type,Parent.Label,PermissionsRead,PermissionsEdit,Parent.PermissionSetGroupId,Parent.Profile.name,Parent.Profile.Id,Parent.IsCustom FROM FieldPermissions WHERE Parent.Type IN (\'Regular\',\'Group\',\'Profile\',\'Session\') AND SobjectType =: objectName  AND ';
                if(permissionType == 'Read'){
                    query += 'PermissionsRead = true AND Field = \''+objectName+'.'+fieldName+'\'';
                }else {
                    query += 'PermissionsEdit = true AND Field = \''+objectName+'.'+fieldName+'\'';
                }
            } else {
                query = 'SELECT Id,ParentId,Parent.Name,Parent.Type,Parent.Label,PermissionsRead,PermissionsEdit,PermissionsCreate,PermissionsDelete,PermissionsViewAllRecords,PermissionsModifyAllRecords,Parent.PermissionSetGroupId,Parent.Profile.name,Parent.Profile.Id,SobjectType,Parent.IsCustom FROM ObjectPermissions WHERE Parent.Type IN (\'Regular\',\'Group\',\'Profile\',\'Session\') AND SobjectType =: objectName AND ';
                if (permissionType == 'Read') {
                    query += 'PermissionsRead = true';                    
                }
                if (permissionType == 'Create') {
                    query += 'PermissionsCreate = true';                    
                }
                if (permissionType == 'Edit') {
                    query += 'PermissionsEdit = true';                    
                }
                if (permissionType == 'Delete') {
                    query += 'PermissionsDelete = true';                    
                }
                if (permissionType == 'View All') {
                    query += 'PermissionsViewAllRecords = true';                    
                }
                if (permissionType == 'Modify All') {
                    query += 'PermissionsModifyAllRecords = true';                    
                }
            }
            //query += ' ORDER BY Parent.Profile.Name,Parent.PermissionSetGroup.MasterLabel,Parent.Label';
            


            String queryResponse = JSON.serialize(Database.query(query));
            System.debug('CSKK Query:'+queryResponse);
            List<PermissionWrapper> permList =  PermissionWrapper.parse(queryResponse);
            for (PermissionWrapper p : permList) {
                permIdPermMapUser.put(p.ParentId, p);
            }
            //Got data in JSON so the same below logic works for both object & fields
            PermissionDetails psd = new PermissionDetails();
            if (userOrgLevel == 'User') {
                if (permIdPermMapUser.size() > 0) {                    
                    List<PermissionSetAssignment> psaList = [SELECT Id,PermissionSetId,PermissionSet.Type,PermissionSetGroupId FROM PermissionSetAssignment WHERE PermissionSetId IN: permIdPermMapUser.keySet() AND AssigneeId =: userId];
                    if (psaList.size() > 0) {
                        for (PermissionSetAssignment psa : psaList) {
                            if (psa.PermissionSet.Type == 'Group' || (psa.PermissionSet.Type == 'Session' && psa.PermissionSetGroupId != null )) {
                                psgAssignedList.add(psa.PermissionSetGroupId); //imp PSG Data
                            }else if(psa.PermissionSet.Type == 'Profile'){
                                profilePermUserAssigned.add(permIdPermMapUser.get(psa.PermissionSetId)); //imp Profile Data
                            }
                            else{
                                psUserAssigned.add(permIdPermMapUser.get(psa.PermissionSetId)); //imp PS Data
                            }
                        }
                        psd.profileUserAssignedTo = profilePermUserAssigned.size() > 0 ? profilePermUserAssigned : null;
                        psd.psUserAssignedTo = psUserAssigned.size() > 0 ? psUserAssigned : null;
                    }
                    
                    if (psgAssignedList.size() > 0) {
                        List<PermissionSetGroupComponent> psgComponents = [SELECT Id,PermissionSetGroupId,PermissionSetId,PermissionSet.Label,PermissionSetGroup.MasterLabel FROM PermissionSetGroupComponent WHERE PermissionSetGroupId IN: psgAssignedList];                        
                        psd.psgDetails = preparePSGDetails(psgComponents,permIdPermMapUser);
                    }else{
                        psd.psgDetails = null;
                    }
                }else {
                    return null;
                }
                return psd;
            } else{
                if (permList.size() > 0) {
                    for (PermissionWrapper fp : permList) {
                        if (fp.Parent.Type == 'Group' || (fp.Parent.Type == 'Session' && fp.Parent?.PermissionSetGroupId != null )) {
                            psgAssignedList.add(fp.Parent.PermissionSetGroupId); //imp
                        }else if(fp.Parent.Type == 'Profile'){
                            profilePermUserAssigned.add(fp);
                        } else{
                            psUserAssigned.add(fp); //imp
                        }
                    }
                    psd.profileUserAssignedTo = profilePermUserAssigned.size() > 0 ? profilePermUserAssigned : null ;
                    psd.psUserAssignedTo = psUserAssigned.size() > 0 ? psUserAssigned : null ;

                    if (psgAssignedList.size() > 0) {
                        List<PermissionSetGroupComponent> psgComponents = [SELECT Id,PermissionSetGroupId,PermissionSetId,PermissionSet.Label,PermissionSetGroup.MasterLabel FROM PermissionSetGroupComponent];
                        psd.psgDetails = preparePSGDetails(psgComponents,permIdPermMapUser);
                    }else{
                        psd.psgDetails = null;
                    }
                }else {
                    return null;
                }
                return psd;
            }
        } catch (Exception e) {
            // System.debug('CSK Error Apex::' + e.getMessage() + ':' + e.getLineNumber() +':::'+ e.getStackTraceString());
            throw new AuraHandledException(e.getMessage());            
        }
    }


    @AuraEnabled
    public static void updatePermission(String objToUpdateList, Boolean fieldPage){
        try {
            List<Object> dataListUntyped = (List<Object>)JSON.deserializeUntyped(objToUpdateList);
            List<Map<String, Object>> dataList = new List<Map<String, Object>>();
            List<FieldPermissions> updateFieldPermissions = new List<FieldPermissions>();
            List<ObjectPermissions> updateObjPermissions = new List<ObjectPermissions>();
            for (Object obj : dataListUntyped) {
                dataList.add((Map<String, Object>)obj);
            }
            for (Map<String, Object> data : dataList) {
                if (fieldPage) {
                    FieldPermissions fp = new FieldPermissions();
                    if (data.get('FieldPermissionId') != null) {
                        fp.Id = (ID)data.get('FieldPermissionId');
                    }
                    if (data.get('Read') != null) {
                        fp.PermissionsRead = (Boolean)data.get('Read');
                    }
                    if (data.get('Edit') != null) {
                        fp.PermissionsEdit = (Boolean)data.get('Edit');
                    }
                    updateFieldPermissions.add(fp);
                }else {
                    ObjectPermissions op = new ObjectPermissions();
                    if (data.get('FieldPermissionId') != null) {
                        op.Id = (ID)data.get('FieldPermissionId');
                    }
                    if (data.get('Read') != null) {
                        op.PermissionsRead = (Boolean)data.get('Read');
                    }
                    if (data.get('Edit') != null) {
                        op.PermissionsEdit = (Boolean)data.get('Edit');
                    }
                    if (data.get('Create') != null) {
                        op.PermissionsCreate = (Boolean)data.get('Create');
                    }
                    if (data.get('Delete') != null) {
                        op.PermissionsDelete = (Boolean)data.get('Delete');
                    }
                    if (data.get('ViewAll') != null) {
                        op.PermissionsViewAllRecords = (Boolean)data.get('ViewAll');
                    }
                    if (data.get('ModifyAll') != null) {
                        op.PermissionsModifyAllRecords = (Boolean)data.get('ModifyAll');
                    }
                    updateObjPermissions.add(op);
                }
            }
            if (updateFieldPermissions?.size() > 0) {
                update updateFieldPermissions;
            }
            if (updateObjPermissions?.size() > 0) {
                update updateObjPermissions;
            }
            
        } catch (Exception e) {
            // System.debug('Error::'+e.getMessage()+':'+e.getLineNumber());
            throw new AuraHandledException(e.getMessage()+':'+e.getLineNumber());
        }
    }

    private static List<PermissionSetGroupDetails> preparePSGDetails(List<PermissionSetGroupComponent> psgComponents,Map<Id,PermissionWrapper> psIdFpMapUser) {
        List<PermissionSetGroupDetails> psgAssinmentDetails = new List<PermissionSetGroupDetails>();
        Map<String,List<PermissionWrapper>> fpGMap = new Map<String,List<PermissionWrapper>>();
        for (PermissionSetGroupComponent psgc : psgComponents) {
            if (psIdFpMapUser.containsKey(psgc.PermissionSetId) && fpGMap.containsKey(psgc.PermissionSetGroup.MasterLabel)) {
                List<PermissionWrapper>  ff = fpGMap.get(psgc.PermissionSetGroup.MasterLabel);
                ff.add(psIdFpMapUser.get(psgc.PermissionSetId));
                fpGMap.put(psgc.PermissionSetGroup.MasterLabel,ff);
            }else if(psIdFpMapUser.containsKey(psgc.PermissionSetId) && !fpGMap.containsKey(psgc.PermissionSetGroup.MasterLabel)){
                fpGMap.put(psgc.PermissionSetGroup.MasterLabel, new List<PermissionWrapper> {psIdFpMapUser.get(psgc.PermissionSetId)});
            }
        }
        for (String p : fpGMap.keySet()) {
            psgAssinmentDetails.add(new PermissionSetGroupDetails(p,fpGMap.get(p)));
        }
        return psgAssinmentDetails;
    }




    public class PermissionDetails {
        @AuraEnabled
        public List<PermissionSetGroupDetails> psgDetails;
        @AuraEnabled
        public List<PermissionWrapper> psUserAssignedTo;
        @AuraEnabled
        public List<PermissionWrapper> profileUserAssignedTo;
    }

    public class PermissionSetGroupDetails{

        public PermissionSetGroupDetails(String PermissionSetGroupMasterLabel,List<PermissionWrapper> FieldPermissionsList){
            this.PermissionSetGroupMasterLabel = PermissionSetGroupMasterLabel;
            this.FieldPermissionsList = FieldPermissionsList;
        }

        @AuraEnabled
        public String PermissionSetGroupMasterLabel;
        @AuraEnabled
        public List<PermissionWrapper> FieldPermissionsList;
    }
}