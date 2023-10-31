
const expressJSDocSwagger = require('express-jsdoc-swagger');

const express=require('express');
const app=express();
var mysql=require('mysql')
app.use(express.json());

var db=mysql.createConnection(
    {host: 'localhost',
    user:'root',
    password: 'meriem',
    database:'nodemysql'
    }
)
// create a table of employees 
app.get('/create_emp_table',(req,res)=>{
    let sql='create table employee (    employee_id INT AUTO_INCREMENT PRIMARY KEY, firstName VARCHAR(50),lastName VARCHAR(50),dateCreated DATE, departement VARCHAR(50))'
       db.query(sql,(err,res)=>{
        //table creation failed ==> throw an error
            if (err) throw err;
            //sucess creating employee table
            console.log(res)
       })
       res.send('table created')
       res.end()
       
})

// check if the connection with mysql database is established
db.connect((err)=>{
    if (err) throw err;
  console.log("Connected!");
})





// end point to add employees via post operation

const options = {
    info: {
      version: '1.0.0',
      title: 'Biometric clock',
     
    },
    filesPattern: './index.js',
    baseDir: __dirname,
    security: {
      BasicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    },
  };
  
  expressJSDocSwagger(app)(options);

   /**
   * An employee object
   * @typedef {object} Employee
   * @property {string} firstName.required - The f name
   * @property {string} lastName - The name
   * @property {string} departement - The departement
   * @property {string} dateCreated
   
   */

/**
 * POST /api/add_employee/'
 * @summary This is the summary of the endpoint
 * @param {Employee} request.body.required - employee info info
 * @return {object} 200 - Employee added successfully 
 * @return {object} 500 - Error adding employee
 */
 app.post('/api/add_employee/', (req, res) => {
    const employee = req.body;
    
    // output the book to the console for debugging
   // console.log(employee);
    const sql = 'INSERT INTO employee (firstName, lastName,  dateCreated,departement ) VALUES (?, ?, ?, ?)';
    const values = [employee.firstName, employee.lastName, new Date, employee.departement];

    // Execute the query to add an employee 
    let query = db.query(sql, values, (err) => {
        if (err) {
           
            res.status(500).send('Error adding employee'); // Send an error response
        } else {
            res.status(200).send('Employee added successfully');
        }
    });


    
});

/**
 * GET /api/get_employees/
 * @summary get the list of all employees
 * @return {object} 200 - success response
 */
//get the list of all employees. 
    app.get('/api/get_employees/', (req, res) => {
        
        const sql = 'SELECT * from employee';
    
        // Execute the query to add an employee 
        let query = db.query(sql, (err,result) => {
            if (err) {
               
                res.status(500).send('Error fetching the employees'); // Send an error response
            } else {
                
               // console.log(result)
                //get the names of employees               
                const employeeList = result.map(employee => `<li>${employee.firstName + "  "+ employee.lastName}</li>`).join('');
                const html = `<html><body><h1>Employee List</h1><ul>${employeeList}</ul></body></html>`;

                res.send(html);
            }
        });   
});

/**
 * GET /api/get_employees/{date}/
 * @summary get the list of employees filtered by dateCreated
 * @param {string} request.date.required - date format YYYY-MM-DD
 * @return {array<Employee>} 200 - success response - application/json
 */
// second endpoint to fetch employees based on the date of creation.
app.get('/api/get_employees/:date/', (req, res) => {
    const da=req.params.date

    const sql =`SELECT * from employee where dateCreated="${da}"`;


    // Execute the query to add an employee 
    let query = db.query(sql, (err,result) => {
        if (err) {
           
            res.status(500).send('Error fetching the employees'); // Send an error response
        } else {
            
            //get the names of employees               
            const employeeList = result.map(employee => `<li>${employee.firstName + "  "+ employee.lastName+ " "+ employee.dateCreated}</li>`).join('');
            const html = `<html><body><h1>Employee List</h1><ul>${employeeList}</ul></body></html>`;

            res.send(html);
        }
    });   
});



// to control the checkin and check out we must create a table which makes connection between the employeeId and the checkin and checkout time

app.get('/api/create_table_emp_control',(req,res)=>{

 const sql='create table employee_control (employee_id INT, FOREIGN KEY (employee_id) REFERENCES employee(employee_id),work_date date, checkin TIME, checkout TIME, comment VARCHAR(100),workTime TIME );'
 let query = db.query(sql, (err,result) => {
    if (err) {
       console.log(err)
       res.status(500).send('cant create table'); // Send an error response
    } else {
res.status(200).send('create table')
    }
})
});
/**
 * POST /api/check_in/:id
 * @summary checkin endpoint 
 * @return {object} 200 - success checkin
 * @returns {object} 500 - failed checkin
 */

//register checkin 
app.post('/api/check_in/:id',(req,res)=>{
    const id = req.params.id;
    
    
  
    const sql = 'INSERT INTO employee_control (employee_id,work_date,checkin ) VALUES (?, ?,?)';


    const values = [id, new Date,new Date];
    let query = db.query(sql,values, (err,result) => {
       if (err) {
          res.status(500).send('checkin failed'); // Send an error response
       } else {
   res.status(200).send('checkin sucess')
       }
   })
   });

/** 
 This is a endpoint to checkout 
 */






/**
 * PUT /api/check_out/{id}
 * @summary checkin endpoint 
 * 
 * @param {integer} request.id.required 

 * @return {object} 200 - success checkin
 * @returns {object} 500 - failed checkin
 */


//register checkout 
app.put('/api/check_out/:id',async (req,res)=>{
    //need the id and the date of the day to update the checkout and time of work
    const id = req.params.id;
    const comment=req.body.comment;

   // console.log(comment)
    var nowDate = new Date(); 
    var current_date = nowDate.getFullYear()+'-'+(nowDate.getMonth()+1)+'-'+nowDate.getDate();
    current_time=nowDate.getHours()+':'+nowDate.getMinutes()+':'+nowDate.getSeconds()
   // console.log(current_time)
   
// fetch the checkin time to calculate the time spent at work

const sql1= `SELECT checkin from employee_control  where employee_id=${id} and work_date='${current_date}'`



let query1 =  db.query(sql1, (err,result) => {
if (err) {
   res.status(500).send('couldn\'t retreive the record'); // Send an error response
} 
else {
    data = result[0];
let checkin_value=JSON.parse(JSON.stringify(result))[0].checkin
//console.log(checkin_value)
time_checkin = new Date(current_date + " " + checkin_value);

let diff=(nowDate-time_checkin)/(1000)

// rewritte it in hours:min:ss format to store it 

const hours = Math.floor(diff / 3600); 

const minutes = Math.floor((diff % 3600) / 60);
const seconds = diff % 60;
let time_diff=hours+':'+minutes+":"+seconds
time_diffe = new Date(current_date + " " + time_diff);

// the actual code to write infos in database

   const sql = `UPDATE  employee_control SET checkout=?, comment=?,workTime=? where employee_id=${id} and work_date='${current_date}'`;
  
   let values=[nowDate,comment,time_diffe]
   console.log(values)
   // register checkout
    let query = db.query(sql,values, (err,result) => {
       if (err) {
          console.log(err)
           res.status(500).send('can not check out'); // Send an error response
       } else {
   res.status(200).send('checkout sucess')
       }
   })


}
})

   
   });


const port=process.env.PORT || 3000
app.listen(port, ()=>console.log(`Listening on port 3000 ${port}`))