import { LightningElement, track } from 'lwc';
import getObjectName from '@salesforce/apex/UserFieldPermissionsAnalyzerController.returnObjectNameFromRecId';
import getPermissionDetails from '@salesforce/apex/UserFieldPermissionsAnalyzerController.getPermissionDetails';
import updatePermission from '@salesforce/apex/UserFieldPermissionsAnalyzerController.updatePermission';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const fieldPermissionOptions = [
    { label: 'Read', value: 'Read' },
    { label: 'Edit', value: 'Edit' }
];

const objectPermissionOptions = [
    { label: 'Read', value: 'Read' },
    { label: 'Create', value: 'Create' },
    { label: 'Edit', value: 'Edit' },
    { label: 'Delete', value: 'Delete' },
    { label: 'View All', value: 'View All' },
    { label: 'Modify All', value: 'Modify All' }
];

const orgOrUserLevelOptions = [
    { label: 'User', value: 'User' },
    { label: 'Org Wide', value: 'OrgWide' }
];

const getObjectByOptions = [
    { label: 'Record Id', value: 'recordId' },
    { label: 'Search by Object Name', value: 'objName' }
];
export default class PermissionTool extends LightningElement {
    fieldPermissionOptions = fieldPermissionOptions;
    objectPermissionOptions = objectPermissionOptions;
    permissionOptions = fieldPermissionOptions;
    orgOrUserLevelOptions = orgOrUserLevelOptions;
    getObjectByOptions = getObjectByOptions;
    permissionValue = 'Read';
    orgOrUserLevelValue = 'User';
    showUserId = true;
    showRecIdField = false;
    showObjectField = false;
    showObjData = false;
    userId = '';
    PlaceholderUser = 'Type User Name here...';
    PlaceholderField = 'Type Field Name here...';
    PlaceholderObject = 'Type Object Name here...';
    getObjectByValue = '';
    objectNamevalue = null;
    fieldNameValue = '';
    fieldNameValueOnUI = null;
    fieldPage = true;
    navBtnLabel = 'Go to object page';
    permissionLabel = 'Field Permissions';
    @track permissionSetGroupDetails = null;
    @track permissionSetDetails = null;
    @track profileDetails = null;
    @track updatePermissionsEditPS = [];
    @track updatePermissionsReadPS = [];
    @track updatePermissionsCreatePS = [];
    @track updatePermissionsDeletePS = [];
    @track updatePermissionsViewAllPS = [];
    @track updatePermissionsMdfyAllPS = [];
    @track readEditObjsCombined = [];
    @track clonePsDetails = null;
    @track clonePsgDetails = null;
    @track profileUserAssignedTo;
    @track defaultSectionName = ['Permission Sets', 'Permission Set Groups', 'Profile'];
    @track spinner = false;
    //baseURL = window.location.origin;

    togglePages() {
        this.fieldNameValueOnUI = null;
        this.fieldNameValue = null;
        this.fieldPage = !this.fieldPage;
        this.navBtnLabel = this.fieldPage === true ? 'Go to object page' : 'Go to Field page';
        this.permissionOptions = this.fieldPage === true ? this.fieldPermissionOptions : objectPermissionOptions;
        this.permissionLabel = this.fieldPage === true ? 'Field Permissions' : 'Object Permissions';
        this.clonePsDetails = null;
        this.clonePsgDetails = null;
        this.cloneProfileDetails = null;
        this.updatePermissionsCreatePS = [];
        this.updatePermissionsDeletePS = [];
        this.updatePermissionsEditPS = [];
        this.updatePermissionsMdfyAllPS = [];
        this.updatePermissionsReadPS = [];
        this.updatePermissionsViewAllPS = [];
        this.readEditObjsCombined = [];
        this.showObjData = false;
    }

    handleRecIdChange(event) {
        if (event.detail.value.length === 3 || event.detail.value.length === 15 || event.detail.value.length === 18) {
            getObjectName({ recId: event.detail.value })
                .then(result => {
                    this.objectNamevalue = result;
                })
                .catch(error => {
                    this.dispatchToastMessage('Error: Get Obj Rec:', error.body.message, 'error');
                });
        }
    }

    handleFieldPermissionChange(event) {
        this.permissionValue = event.detail.value;
    }

    onUserSelection(event) {
        this.userId = event.detail.selectedRecordId;
    }

    onFieldSelection(event) {
        this.fieldNameValue = event.detail.selectedRecordId;
    }

    onObjectSelection(event) {
        this.objectNamevalue = event.detail.selectedRecordId;
    }

    handleUserOrOrgChange(event) {
        this.orgOrUserLevelValue = event.detail.value;
        this.showUserId = this.orgOrUserLevelValue === 'OrgWide' ? false : true;
    }

    handlegetObjectByChange(event) {
        if (event.detail.value === 'recordId') {
            this.showRecIdField = true;
            this.showObjectField = false;
        } else {
            this.showObjectField = true;
            this.showRecIdField = false;
        }
    }

    handleGetDetails() {
        this.getPsDetails();
    }

    handleCheckBoxes(perRecId, permission, value) {
        this.template.querySelectorAll('[data-option=\'' + perRecId + permission + '\']').forEach(checkbox => {
            checkbox.checked = value;
        });
    }

    permissionObjGen(psId, latestValue, permObjArray, permission) {
        permObjArray = [{ "FieldPermissionId": psId, [permission]: latestValue }, ...permObjArray];
        permObjArray = permObjArray.map(item => {
            return item.FieldPermissionId === psId ? { ...item, ...{ "FieldPermissionId": psId, [permission]: latestValue } } : item;
        });
        return Array.from(new Map(permObjArray.map(obj => [JSON.stringify(obj), obj])).values());
    }

    handleReadChange(event) {
        let latestValue = event.target.checked;
        let psId = event.target.name;

        this.handleCheckBoxes(psId, 'Read', latestValue);
        this.updatePermissionsReadPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsReadPS, "Read");
        if (!latestValue) {
            this.handleCheckBoxes(psId, 'Edit', latestValue);
            this.updatePermissionsEditPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsEditPS, "Edit");
            if (!this.fieldPage) {
                this.handleCheckBoxes(psId, 'Create', latestValue);
                this.handleCheckBoxes(psId, 'Delete', latestValue);
                this.handleCheckBoxes(psId, 'ViewAll', latestValue);
                this.handleCheckBoxes(psId, 'ModifyAll', latestValue);
                this.updatePermissionsCreatePS = this.permissionObjGen(psId, latestValue, this.updatePermissionsCreatePS, "Create");
                this.updatePermissionsDeletePS = this.permissionObjGen(psId, latestValue, this.updatePermissionsDeletePS, "Delete");
                this.updatePermissionsViewAllPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsViewAllPS, "ViewAll");
                this.updatePermissionsMdfyAllPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsMdfyAllPS, "ModifyAll");
            }
        }
        this.genSaveObj();
    }

    handleEditChange(event) {
        let latestValue = event.target.checked;
        let psId = event.target.name;

        this.handleCheckBoxes(psId, 'Edit', latestValue);
        this.updatePermissionsEditPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsEditPS, "Edit");
        if (latestValue) {
            this.handleCheckBoxes(psId, 'Read', latestValue);
            this.updatePermissionsReadPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsReadPS, "Read");
        }
        if (!latestValue && !this.fieldPage) {
            this.handleCheckBoxes(psId, 'Delete', latestValue);
            this.handleCheckBoxes(psId, 'ModifyAll', latestValue);
            this.updatePermissionsDeletePS = this.permissionObjGen(psId, latestValue, this.updatePermissionsDeletePS, "Delete");
            this.updatePermissionsMdfyAllPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsMdfyAllPS, "ModifyAll");
        }
        this.genSaveObj();
    }

    handleCreateChange(event) {
        let latestValue = event.target.checked;
        let psId = event.target.name;

        this.handleCheckBoxes(psId, 'Create', latestValue);
        this.updatePermissionsCreatePS = this.permissionObjGen(psId, latestValue, this.updatePermissionsCreatePS, "Create");
        if (latestValue) {
            this.handleCheckBoxes(psId, 'Read', latestValue);
            this.updatePermissionsReadPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsReadPS, "Read");
        }
        this.genSaveObj();
    }

    handleDeleteChange(event) {
        let latestValue = event.target.checked;
        let psId = event.target.name;

        this.handleCheckBoxes(psId, 'Delete', latestValue);
        this.updatePermissionsDeletePS = this.permissionObjGen(psId, latestValue, this.updatePermissionsDeletePS, "Delete");
        if (!latestValue) {
            this.handleCheckBoxes(psId, 'ModifyAll', latestValue);
            this.updatePermissionsMdfyAllPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsMdfyAllPS, "ModifyAll");
        }

        if (latestValue) {
            this.handleCheckBoxes(psId, 'Read', latestValue);
            this.handleCheckBoxes(psId, 'Edit', latestValue);
            this.updatePermissionsReadPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsReadPS, "Read");
            this.updatePermissionsEditPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsEditPS, "Edit");
        }
        this.genSaveObj();
    }

    handleViewAllChange(event) {
        let latestValue = event.target.checked;
        let psId = event.target.name;

        this.handleCheckBoxes(psId, 'ViewAll', latestValue);
        this.updatePermissionsViewAllPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsViewAllPS, "ViewAll");
        if (!latestValue) {
            this.handleCheckBoxes(psId, 'ModifyAll', latestValue);
            this.updatePermissionsMdfyAllPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsMdfyAllPS, "ModifyAll");
        }
        if (latestValue) {
            this.handleCheckBoxes(psId, 'Read', latestValue);
            this.updatePermissionsReadPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsReadPS, "Read");
        }
        this.genSaveObj();
    }

    handleModifyAllChange(event) {
        let latestValue = event.target.checked;
        let psId = event.target.name;

        this.handleCheckBoxes(psId, 'ModifyAll', latestValue);
        this.updatePermissionsMdfyAllPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsMdfyAllPS, "ModifyAll");
        if (latestValue) {
            this.handleCheckBoxes(psId, 'Delete', latestValue);
            this.handleCheckBoxes(psId, 'ViewAll', latestValue);
            this.handleCheckBoxes(psId, 'Read', latestValue);
            this.handleCheckBoxes(psId, 'Edit', latestValue);
            this.updatePermissionsDeletePS = this.permissionObjGen(psId, latestValue, this.updatePermissionsDeletePS, "Delete");
            this.updatePermissionsViewAllPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsViewAllPS, "ViewAll");
            this.updatePermissionsReadPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsReadPS, "Read");
            this.updatePermissionsEditPS = this.permissionObjGen(psId, latestValue, this.updatePermissionsEditPS, "Edit");
        }
        this.genSaveObj();
    }

    genSaveObj() {
        try {
            let readEditObjs = this.fieldPage ? [...this.updatePermissionsEditPS, ...this.updatePermissionsReadPS] : [...this.updatePermissionsEditPS, ...this.updatePermissionsReadPS, ...this.updatePermissionsCreatePS, ...this.updatePermissionsDeletePS, ...this.updatePermissionsViewAllPS, ...this.updatePermissionsMdfyAllPS];
            this.readEditObjsCombined = readEditObjs.reduce((acc, curr) => {
                let existingItem = acc.find(item => item.FieldPermissionId === curr.FieldPermissionId);
                if (existingItem) {
                    Object.assign(existingItem, curr);
                } else {
                    acc.push(curr);
                }
                return acc;
            }, []);

            if (this.fieldPage) {
                for (let i = 0; i < this.readEditObjsCombined.length; i++) {
                    let subObj = this.readEditObjsCombined[i];
                    let indexps = this.permissionSetDetails.findIndex(obj => (obj.Id === subObj.FieldPermissionId) && (('Read' in subObj) ? obj.PermissionsRead === subObj.Read : true) && (('Edit' in subObj) ? obj.PermissionsEdit === subObj.Edit : true));
                    if (indexps !== -1) {
                        this.readEditObjsCombined.splice(i, 1);
                        i--;
                    }
                    let indexpf = this.profileDetails.findIndex(obj => (obj.Id === subObj.FieldPermissionId) && (('Read' in subObj) ? obj.PermissionsRead === subObj.Read : true) && (('Edit' in subObj) ? obj.PermissionsEdit === subObj.Edit : true));
                    if (indexpf !== -1) {
                        this.readEditObjsCombined.splice(i, 1);
                        i--;
                    }
                }

                for (let i = 0; i < this.readEditObjsCombined.length; i++) {
                    let subObj = this.readEditObjsCombined[i];
                    let index = -1;
                    this.permissionSetGroupDetails.forEach(currentItem => {
                        index = currentItem.FieldPermissionsList.findIndex(obj => (obj.Id === subObj.FieldPermissionId) && (('Read' in subObj) ? obj.PermissionsRead === subObj.Read : true) && (('Edit' in subObj) ? obj.PermissionsEdit === subObj.Edit : true));
                    });
                    if (index !== -1) {
                        this.readEditObjsCombined.splice(i, 1);
                        i--;
                    }
                }
            } else {
                for (let i = 0; i < this.readEditObjsCombined.length; i++) {
                    let subObj = this.readEditObjsCombined[i];
                    let indexps = this.permissionSetDetails.findIndex(obj => (obj.Id === subObj.FieldPermissionId) && (('Read' in subObj) ? obj.PermissionsRead === subObj.Read : true) && (('Edit' in subObj) ? obj.PermissionsEdit === subObj.Edit : true) && (('Create' in subObj) ? obj.PermissionsCreate === subObj.Create : true) && (('Delete' in subObj) ? obj.PermissionsDelete === subObj.Delete : true) && (('ViewAll' in subObj) ? obj.PermissionsViewAllRecords === subObj.ViewAll : true) && (('ModifyAll' in subObj) ? obj.PermissionsModifyAllRecords === subObj.ModifyAll : true));
                    if (indexps !== -1) {
                        this.readEditObjsCombined.splice(i, 1);
                        i--;
                    }
                    let indexpf = this.profileDetails.findIndex(obj => (obj.Id === subObj.FieldPermissionId) && (('Read' in subObj) ? obj.PermissionsRead === subObj.Read : true) && (('Edit' in subObj) ? obj.PermissionsEdit === subObj.Edit : true) && (('Create' in subObj) ? obj.PermissionsCreate === subObj.Create : true) && (('Delete' in subObj) ? obj.PermissionsDelete === subObj.Delete : true) && (('ViewAll' in subObj) ? obj.PermissionsViewAllRecords === subObj.ViewAll : true) && (('ModifyAll' in subObj) ? obj.PermissionsModifyAllRecords === subObj.ModifyAll : true));
                    if (indexpf !== -1) {
                        this.readEditObjsCombined.splice(i, 1);
                        i--;
                    }
                }

                for (let i = 0; i < this.readEditObjsCombined.length; i++) {
                    let subObj = this.readEditObjsCombined[i];
                    let index = -1;
                    this.permissionSetGroupDetails.forEach(currentItem => {
                        index = currentItem.FieldPermissionsList.findIndex(obj => (obj.Id === subObj.FieldPermissionId) && (('Read' in subObj) ? obj.PermissionsRead === subObj.Read : true) && (('Edit' in subObj) ? obj.PermissionsEdit === subObj.Edit : true) && (('Create' in subObj) ? obj.PermissionsCreate === subObj.Create : true) && (('Delete' in subObj) ? obj.PermissionsDelete === subObj.Delete : true) && (('ViewAll' in subObj) ? obj.PermissionsViewAllRecords === subObj.ViewAll : true) && (('ModifyAll' in subObj) ? obj.PermissionsModifyAllRecords === subObj.ModifyAll : true));
                    });
                    if (index !== -1) {
                        this.readEditObjsCombined.splice(i, 1);
                        i--;
                    }
                }

            }

            this.template.querySelectorAll('tr').forEach(curr => {
                curr.style.backgroundColor = 'white';
            });
            if (this.readEditObjsCombined.length > 0) {
                const PermIds = this.readEditObjsCombined.map(item => item.FieldPermissionId);
                PermIds.forEach(currentItem => {
                    this.template.querySelectorAll('tr[data-style=\'' + currentItem + '\']').forEach(curr => {
                        curr.style.backgroundColor = '#F9E3B6';
                    });
                });
            }
        } catch (error) {
            this.dispatchToastMessage('Error:', error.message, 'error');
        }

    }


    handleSave() {
        try {
            // console.log('CSK:Final Save:',JSON.stringify(this.readEditObjsCombined));

            if (this.readEditObjsCombined.length > 0) {
                updatePermission({ objToUpdateList: JSON.stringify(this.readEditObjsCombined), fieldPage: this.fieldPage })
                    .then(result => {
                        this.getPsDetails();
                    })
                    .catch(error => {
                        this.dispatchToastMessage('Error: Save:', error.body.message, 'error');
                    });
            } else {
                this.dispatchToastMessage('Info', 'There are no changes. Permission are same as earlier', 'warning');
            }
        } catch (error) {
            this.dispatchToastMessage('Error:Process Save:', error.message, 'error');
        }
    }

    getPsDetails() {
        this.spinner = true;
        this.fieldNameValueOnUI = this.fieldNameValue;
        this.showObjData = !this.fieldPage;
        this.clonePsDetails = null;
        this.clonePsgDetails = null;
        this.cloneProfileDetails = null;
        this.updatePermissionsCreatePS = [];
        this.updatePermissionsDeletePS = [];
        this.updatePermissionsEditPS = [];
        this.updatePermissionsMdfyAllPS = [];
        this.updatePermissionsReadPS = [];
        this.updatePermissionsViewAllPS = [];
        this.readEditObjsCombined = [];
        getPermissionDetails({ permissionType: this.permissionValue, objectName: this.objectNamevalue, userOrgLevel: this.orgOrUserLevelValue, userId: this.userId, fieldName: this.fieldNameValue, fieldOrObj: this.fieldPage })
            .then(result => {
                if (result) {
                    try {
                        // console.log('CSK Result Get:',JSON.stringify(result));

                        //Permission Set
                        if (result.psUserAssignedTo) {
                            this.permissionSetDetails = result.psUserAssignedTo;
                            this.permissionSetDetails.sort((a, b) => {
                                const nameA = a.Parent.Label.toUpperCase();
                                const nameB = b.Parent.Label.toUpperCase();
                                if (nameA < nameB) {
                                    return -1;
                                }
                                if (nameA > nameB) {
                                    return 1;
                                }
                                return 0;
                            });

                            this.clonePsDetails = this.permissionSetDetails.map(item => {
                                return this.fieldPage ? { ...item, ...{ 'uniqueKeyRead': item.Id + 'Read', 'uniqueKeyEdit': item.Id + 'Edit' } } : { ...item, ...{ 'uniqueKeyRead': item.Id + 'Read', 'uniqueKeyEdit': item.Id + 'Edit', 'uniqueKeyCreate': item.Id + 'Create', 'uniqueKeyDelete': item.Id + 'Delete', 'uniqueKeyViewAll': item.Id + 'ViewAll', 'uniqueKeyModifyAll': item.Id + 'ModifyAll' } };
                            });
                        }

                        //Profile
                        if (result.profileUserAssignedTo) {
                            this.profileDetails = result.profileUserAssignedTo;
                            this.profileDetails.sort((a, b) => {
                                const nameA = a.Parent.Profile.Name.toUpperCase();
                                const nameB = b.Parent.Profile.Name.toUpperCase();
                                if (nameA < nameB) {
                                    return -1;
                                }
                                if (nameA > nameB) {
                                    return 1;
                                }
                                return 0;
                            });

                            this.cloneProfileDetails = this.profileDetails.map(item => {
                                return this.fieldPage ? { ...item, ...{ 'uniqueKeyRead': item.Id + 'Read', 'uniqueKeyEdit': item.Id + 'Edit' } } : { ...item, ...{ 'uniqueKeyRead': item.Id + 'Read', 'uniqueKeyEdit': item.Id + 'Edit', 'uniqueKeyCreate': item.Id + 'Create', 'uniqueKeyDelete': item.Id + 'Delete', 'uniqueKeyViewAll': item.Id + 'ViewAll', 'uniqueKeyModifyAll': item.Id + 'ModifyAll' } };
                            });
                        }

                        //Permission Set Group
                        if (result.psgDetails) {
                            this.permissionSetGroupDetails = result.psgDetails;

                            this.permissionSetGroupDetails.sort((a, b) => {
                                const nameA = a.PermissionSetGroupMasterLabel.toUpperCase();
                                const nameB = b.PermissionSetGroupMasterLabel.toUpperCase();
                                if (nameA < nameB) {
                                    return -1;
                                }
                                if (nameA > nameB) {
                                    return 1;
                                }
                                return 0;
                            });

                            this.permissionSetGroupDetails.forEach(element => {
                                element.FieldPermissionsList.sort((a, b) => {
                                    const nameA = a.Parent.Label.toUpperCase();
                                    const nameB = b.Parent.Label.toUpperCase();
                                    if (nameA < nameB) {
                                        return -1;
                                    }
                                    if (nameA > nameB) {
                                        return 1;
                                    }
                                    return 0;
                                });
                            });

                            this.clonePsgDetails = this.permissionSetGroupDetails.map(item => {
                                let fieldPermissionsList = item.FieldPermissionsList.map(permission => {
                                    return this.fieldPage ? {
                                        ...permission,
                                        uniqueKeyRead: permission.Id + "Read",
                                        uniqueKeyEdit: permission.Id + "Edit"
                                    } : { ...permission, ...{ 'uniqueKeyRead': permission.Id + 'Read', 'uniqueKeyEdit': permission.Id + 'Edit', 'uniqueKeyCreate': permission.Id + 'Create', 'uniqueKeyDelete': permission.Id + 'Delete', 'uniqueKeyViewAll': permission.Id + 'ViewAll', 'uniqueKeyModifyAll': permission.Id + 'ModifyAll' } };
                                });

                                return {
                                    ...item,
                                    FieldPermissionsList: fieldPermissionsList
                                };
                            });
                        }
                    } catch (error) {
                        this.dispatchToastMessage('Error::Perp Get Data::', error.message, 'error');
                    }
                }
                this.spinner = false;
            })
            .catch(error => {
                this.spinner = false;
                this.dispatchToastMessage('Error::Get Data:', error.body.message, 'error');
            });
    }

    dispatchToastMessage(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }
}