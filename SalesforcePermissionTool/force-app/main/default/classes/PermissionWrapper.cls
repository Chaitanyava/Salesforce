public class PermissionWrapper {
	@AuraEnabled
	public Attributes attributes {get;set;} 
    @AuraEnabled
	public String Id {get;set;} 
    @AuraEnabled
	public String ParentId {get;set;} 
    @AuraEnabled
	public Boolean PermissionsRead {get;set;} 
    @AuraEnabled
	public Boolean PermissionsEdit {get;set;}
	@AuraEnabled
	public Boolean PermissionsCreate {get;set;}
	@AuraEnabled
	public Boolean PermissionsDelete {get;set;}
	@AuraEnabled
	public Boolean PermissionsViewAllRecords {get;set;}
	@AuraEnabled
	public Boolean PermissionsModifyAllRecords {get;set;} 
	@AuraEnabled//*
	public String SobjectType {get;set;}//*
    @AuraEnabled
	public Parent Parent {get;set;} 

	public PermissionWrapper(JSONParser parser) {
		while (parser.nextToken() != System.JSONToken.END_OBJECT) {
			if (parser.getCurrentToken() == System.JSONToken.FIELD_NAME) {
				String text = parser.getText();
				if (parser.nextToken() != System.JSONToken.VALUE_NULL) {
					if (text == 'attributes') {
						attributes = new Attributes(parser);
					} else if (text == 'Id') {
						Id = parser.getText();
					} else if (text == 'ParentId') {
						ParentId = parser.getText();
					} else if (text == 'SobjectType') {
						SobjectType = parser.getText();
					} else if (text == 'PermissionsRead') {
						PermissionsRead = parser.getBooleanValue();
					} else if (text == 'PermissionsEdit') {
						PermissionsEdit = parser.getBooleanValue();
					} else if (text == 'PermissionsCreate') {
						PermissionsCreate = parser.getBooleanValue();
					} else if (text == 'PermissionsDelete') {
						PermissionsDelete = parser.getBooleanValue();
					} else if (text == 'PermissionsViewAllRecords') {
						PermissionsViewAllRecords = parser.getBooleanValue();
					} else if (text == 'PermissionsModifyAllRecords') {
						PermissionsModifyAllRecords = parser.getBooleanValue();
					} else if (text == 'Parent') {
						Parent = new Parent(parser);
					}else {
						System.debug(LoggingLevel.WARN, 'PermissionWrapper consuming unrecognized property: '+text);
						consumeObject(parser);
					}
				}
			}
		}
	}
	
	public class Parent {
        @AuraEnabled
		public Attributes attributes {get;set;} 
        @AuraEnabled
		public String Name {get;set;} 
        @AuraEnabled
		public String Type {get;set;} 
        @AuraEnabled
		public String Label {get;set;} 
        @AuraEnabled
		public String ProfileId {get;set;} 
        @AuraEnabled
		public String Id {get;set;} 
        @AuraEnabled
		public Profile Profile {get;set;} 
        @AuraEnabled
        public String PermissionSetGroupId;
		@AuraEnabled
		public Boolean IsCustom;

		public Parent(JSONParser parser) {
			while (parser.nextToken() != System.JSONToken.END_OBJECT) {
				if (parser.getCurrentToken() == System.JSONToken.FIELD_NAME) {
					String text = parser.getText();
					if (parser.nextToken() != System.JSONToken.VALUE_NULL) {
						if (text == 'attributes') {
							attributes = new Attributes(parser);
						} else if (text == 'Name') {
							Name = parser.getText();
						} else if (text == 'Type') {
							Type = parser.getText();
						} else if (text == 'Label') {
							Label = parser.getText();
						} else if (text == 'ProfileId') {
							ProfileId = parser.getText();
						} else if (text == 'Id') {
							Id = parser.getText();
						} else if (text == 'Profile') {
							Profile = new Profile(parser);
						}else if (text == 'PermissionSetGroupId') {
							PermissionSetGroupId = parser.getText();
						}else if (text == 'IsCustom') {
							IsCustom = parser.getBooleanValue();
						} else {
							System.debug(LoggingLevel.WARN, 'Parent consuming unrecognized property: '+text);
							consumeObject(parser);
						}
					}
				}
			}
		}
	}
	
	public class Attributes {
        @AuraEnabled
		public String type {get;set;} 
        @AuraEnabled
		public String url {get;set;} 

		public Attributes(JSONParser parser) {
			while (parser.nextToken() != System.JSONToken.END_OBJECT) {
				if (parser.getCurrentToken() == System.JSONToken.FIELD_NAME) {
					String text = parser.getText();
					if (parser.nextToken() != System.JSONToken.VALUE_NULL) {
						if (text == 'type') {
							type = parser.getText();
						} else if (text == 'url') {
							url = parser.getText();
						} else {
							System.debug(LoggingLevel.WARN, 'Attributes consuming unrecognized property: '+text);
							consumeObject(parser);
						}
					}
				}
			}
		}
	}
	
	public class Profile {
		@AuraEnabled
		public Attributes attributes {get;set;} 
        @AuraEnabled
		public String Name {get;set;} 
        @AuraEnabled
		public String Id {get;set;} 

		public Profile(JSONParser parser) {
			while (parser.nextToken() != System.JSONToken.END_OBJECT) {
				if (parser.getCurrentToken() == System.JSONToken.FIELD_NAME) {
					String text = parser.getText();
					if (parser.nextToken() != System.JSONToken.VALUE_NULL) {
						if (text == 'attributes') {
							attributes = new Attributes(parser);
						} else if (text == 'Name') {
							Name = parser.getText();
						} else if (text == 'Id') {
							Id = parser.getText();
						} else {
							System.debug(LoggingLevel.WARN, 'Profile consuming unrecognized property: '+text);
							consumeObject(parser);
						}
					}
				}
			}
		}
	}
	
	
	public static List<PermissionWrapper> parse(String json) {
		System.JSONParser parser = System.JSON.createParser(json);
		return arrayOfPermissionWrapper(parser);
	}
	
	public static void consumeObject(System.JSONParser parser) {
		Integer depth = 0;
		do {
			System.JSONToken curr = parser.getCurrentToken();
			if (curr == System.JSONToken.START_OBJECT || 
				curr == System.JSONToken.START_ARRAY) {
				depth++;
			} else if (curr == System.JSONToken.END_OBJECT ||
				curr == System.JSONToken.END_ARRAY) {
				depth--;
			}
		} while (depth > 0 && parser.nextToken() != null);
	}
	

    private static List<PermissionWrapper> arrayOfPermissionWrapper(System.JSONParser p) {
        List<PermissionWrapper> res = new List<PermissionWrapper>();
        if (p.getCurrentToken() == null) p.nextToken();
        while (p.nextToken() != System.JSONToken.END_ARRAY) {
            res.add(new PermissionWrapper(p));
        }
        return res;
    }   
}