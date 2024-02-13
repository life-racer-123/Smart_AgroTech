import { LightningElement, track, wire } from 'lwc';
import LightningAlert from 'lightning/alert';
import updateTimesheetRecordWeekday from '@salesforce/apex/TimesheetController.updateTimesheetRecord';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import timesheet from '@salesforce/schema/Timesheet__c';
import empname from '@salesforce/schema/Timesheet__c.Employee_Name__c';
import empid from '@salesforce/schema/Timesheet__c.Employee_ID__c';
import racfid from '@salesforce/schema/Timesheet__c.RACF_ID__c';
import entryType from '@salesforce/schema/Timesheet__c.Entry_Type__c';
export default class Timesheet extends LightningElement {
    @track selectedProject='';
    @track selectedTask = '';
    @track hours ='';
    @track projectOptions=[{label: 'DLG Interim Tribe C&SS Squads', value:'DLG Interim Tribe C&SS Squads'}];
    // @track taskOptions = [{label: 'Task 1', value:'Task 1'},
    //                       {label: 'Task 2', value: 'Task 2'}];;



    @track RACFID= '';
    @track Efname='';
    @track Lfname='';
    @track EId='';
    @track button = false;
    @track showWeekdays = false;
    @track showWeekend= false;
    @track selectedEmpId='';
    @track selectedRACFId='';
    @track selectedEmpName='';
    @track EmpIdOptions=[];
    @track RACFIdOptions = [];
    @track EmpNameOptions = [];
    @track EntryOptions=[];
    @track selectedShift='';
    hoursArray = [0];
    hoursArrayW = [0];
    isWeekend=false;
    weekendStartDate='';

    @wire(getObjectInfo,{objectApiName: 'Timesheet__c'})timesheetInfo;

    @wire(getPicklistValues,{recordTypeId: '$timesheetInfo.data.defaultRecordTypeId', fieldApiName: racfid})
    RACFIdInfo({data,error}){
        if(data){
           // this.RACFIdOptions= data.values;
            this.RACFIdData = data;
        }

    }

    @wire(getPicklistValues,{recordTypeId: '$timesheetInfo.data.defaultRecordTypeId', fieldApiName: empname})
    EmpNameInfo({data,error}){
        if(data){
            //this.EmpNameOptions=data.values;
            this.EMPNameData=data;
        }
    }

    @wire(getPicklistValues,{recordTypeId: '$timesheetInfo.data.defaultRecordTypeId', fieldApiName: empid})
    EmpIdInfo({data,error}){
        if(data){
            this.EmpIdOptions=data.values;
        }
        
    }
    @wire(getPicklistValues,{recordTypeId: '$timesheetInfo.data.defaultRecordTypeId', fieldApiName: entryType})
    EntryInfo({data,error}){
        if(data){
            this.EntryOptions=data.values;
        }
        
    }
    
    handleShiftChange(event){
        this.selectedShift=event.target.value;
        console.log(this.selectedShift);
    }
    
    handleRACFIdChange(event){
        this.selectedRACFId=event.detail.value;
        console.log(this.selectedRACFId);
         let key=this.EMPNameData.controllerValues[event.target.value];
         this.EmpNameOptions=this.EMPNameData.values.filter(opt => opt.validFor.includes(key));
    }
    handleEnameChange(event){
        this.selectedEmpName=event.target.value;
        console.log(this.selectedEmpName);
    }
    handleStateChange(event){
        this.selectedEmpId=event.target.value;
        console.log(this.selectedEmpId);
        let key=this.RACFIdData.controllerValues[event.target.value];
         this.RACFIdOptions=this.RACFIdData.values.filter(opt => opt.validFor.includes(key));
    }

    
    handleELnameChange(event){
        this.Lfname = event.target.value;
    }
    handleEemailChange(event){
        this.Eemail = event.target.value;
        console.log(this.Eemail);
    }
    handleEIdChange(event){
        this.EId= event.target.value;
    }
    handleProjectChange(event){
        this.selectedProject = event.detail.value;
    }
   
    @track selectedWeek='';
    @track daysOfWeek=[];
    @track WeekEnd=[];
    lastDate='';
    firstDayOfWeek;
    handleWeekChange(event){
        this.selectedWeek = event.target.value;        
        this.calculateDaysOfWeek();
        this.button=true;
        
    }
    calculateDaysOfWeek(){
        if(this.selectedWeek){
            const [selectedYear, selectedWeekNumber] = this.selectedWeek.split('-W');
            
            this.firstDayOfWeek= new Date(selectedYear, 0, 2+(selectedWeekNumber -1) * 7);
            
            const tempday=[];
            const daysOfWeekEnd=[];
            const daysOfWeek = [];
            for(let i=0;i<5;i++){
                const currentDate = new Date(this.firstDayOfWeek);
                
                currentDate.setDate(this.firstDayOfWeek.getDate()+i);
                
                const dayLabel = new Intl.DateTimeFormat('en-Us', { weekday: 'long'}).format(currentDate);
                const year= currentDate.getFullYear();
                const month = String(currentDate.getMonth()+1).padStart(2, 0);
                const day = String(currentDate.getDate()).padStart(2,0);
                const formattedDate = year+"-"+month+"-"+day;
                daysOfWeek.push({label: dayLabel, date: formattedDate, hours: 0});
            }
            this.daysOfWeek = daysOfWeek;
            const currentDateW = new Date(this.firstDayOfWeek);
            for(let i=0;i<7;i++){
                
                const dayOfWeek = currentDateW.getDay();
                if(i === 5 || i === 6){
                    const dayLabel = new Intl.DateTimeFormat('en-Us', { weekday: 'long'}).format(currentDateW);
                    const year= currentDateW.getFullYear();
                    const month = String(currentDateW.getMonth()+1).padStart(2, 0);
                    const day = String(currentDateW.getDate()).padStart(2,0);
                    const formattedDate = year+"-"+month+"-"+day;
                    if(i==6){
                        this.lastDate=formattedDate;
                    }else{
                        this.weekendStartDate=formattedDate;
                    }
                    tempday.push({label: dayLabel, date: formattedDate, hours: 0});
                }
                currentDateW.setDate(currentDateW.getDate()+1);
            }
            this.WeekEnd=tempday;
            console.log(this.WeekEnd);
        }
        
    }

    handleWeekDay0900(event){
        const selectedDate=event.target.dataset.day;
        const inputHours = parseInt(event.target.value, 10);
        console.log(inputHours);
        const updatedDays = this.daysOfWeek.map(day => {
            if(day.date === selectedDate){
                return{...day, hours0900: inputHours};
            }
            return day;
        });
        
        this.daysOfWeek = updatedDays;
        this.hoursArray = this.daysOfWeek.map(day => day.hours0900);
    }
    handleWeekendDay0900(event){
        const selectedDate=event.target.dataset.day;
        const inputHours = parseInt(event.target.value, 10);
        console.log(inputHours);
        const updatedDays = this.WeekEnd.map(day => {
            if(day.date === selectedDate){
                return{...day, hours: inputHours};
            }
            return day;
        });
        
        this.WeekEnd = updatedDays;
        this.hoursArrayW = this.WeekEnd.map(day => day.hours);
        console.log(this.hoursArrayW);
    }
    handleWeekdays(event){
        this.showWeekdays=true;
        this.showWeekend=false;
        this.isWeekend=false;
    }
    handleWeekend(event){
        this.showWeekend=true;
        this.showWeekdays=false;
        this.isWeekend=true;
    }
    handleSubmit(event){
       // const hoursArray = this.daysOfWeek.map(day => day.hours);
        console.log(this.hoursArrayW);
        console.log(this.hoursArray);
        const year= this.firstDayOfWeek.getFullYear();
        const month = String(this.firstDayOfWeek.getMonth()+1).padStart(2, 0);
        const day = String(this.firstDayOfWeek.getDate()).padStart(2,0);
        const monthName = new Intl.DateTimeFormat('en-Us', { month: 'long'}).format(this.firstDayOfWeek);
        const formattedDate = year+"-"+month+"-"+day;
        const SDate = formattedDate.toString();
        const Fname = this.Efname+' '+this.Lfname;
        console.log(SDate+'   '+this.lastDate);
        const selectedMonth = monthName+' '+year;
        console.log(selectedMonth);
        const inputFields = this.template.querySelectorAll('lightning-input');
        let isvalid=true;
        inputFields.forEach(field =>{
            if(!field.checkValidity()){
                isvalid = false;
                console.log(inputFields);
                field.reportValidity();
            }
        });
        const inputFields_1 = this.template.querySelectorAll('lightning-combobox', 'input');
        let isvalid_1= true;
        inputFields_1.forEach(field =>{
            if(!field.checkValidity()){
                isvalid_1 = false;
                field.reportValidity();
            }
        });
        if(isvalid === true & isvalid_1 === true){
        updateTimesheetRecordWeekday({startDate: SDate, EmpId: this.selectedEmpId, RACFID:this.selectedRACFId, hours: this.hoursArray, lastDate: this.lastDate, EmpName: this.selectedEmpName,
          Project: this.selectedProject, EntryType: this.selectedShift, Month: selectedMonth, weekend: this.isWeekend, WHours: this.hoursArrayW, WeekendStartDate: this.weekendStartDate})
        .then(result =>{
            console.log(result);
            if(result === 'success'){
                LightningAlert.open({
                    message : 'Thank You!! Your Timesheet Submitted Successfully!!',
                    theme: 'success',
                    label: 'Success',
                });
            }else if(result === 'error'){
                LightningAlert.open({
                    message : 'Error!! You already Submitted Timesheet!! Duplicate Entry..',
                    theme: 'error',
                    label: 'Error',
                });
            }
            
        }).catch(error =>{
            LightningAlert.open({
                message : 'Error!!Unexpected Error Submit after some time !',
                theme: 'error',
                label: 'Error',
            });
        })
    }
    }

}