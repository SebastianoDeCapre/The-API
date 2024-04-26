const express = require("express")
const app = express()
const mysql = require("mysql2/promise")
const {join} = require("node:path")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// parse application/json, för att hantera att man POSTar med JSON
const bodyParser = require("body-parser")

// Inställningar av servern.
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

async function getDBConnnection() {
  // Här skapas ett databaskopplings-objekt med inställningar för att ansluta till servern och databasen.
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "restapi",
  })
}

app.get("/", (req, res) => {
  res.send(`<h1>Saker du kan skriva in</h1>
  <ul><li> GET /users</li></ul>
  <ul><li> GET /users/1</li></ul>
  <ul><li> GET /users/2</li></ul>
  <ul><li> GET /users?id=[id]</li></ul>
  <ul><li> GET /users?username=[user]</li></ul>
  <ul><li> If you go to /users you have to include values for username, password, last name and first name</li></ul>
  <ul><li> POST /signup </li></ul>`)
})

/*
  app.post() hanterar en http request med POST-metoden.
*/
app.get("/users/:id", function (req, res) {
  // Data som postats till routen ligger i body-attributet på request-objektet.
  console.log(req.params);
  if (req.params.id == 1) {
    let answer = {message: "Baller"}
    res.json(answer)
  } if (req.params.id == 2) {
    let answer = {message: "Joel"}
    res.json(answer)
  } else {
    let answer = {message: "No such user"}
    res.json(answer)
  }



  // POST ska skapa något så här kommer det behövas en INSERT
  let sql = `INSERT INTO ...`
})

app.get('/users', async function(req, res) {

  let authHeader = req.headers['authorization']
  if (authHeader === undefined) {
  // skicka lämplig HTTP-status om auth-header saknas, en “400 någonting”
  console.log("din kod har en error");
}
  console.log(authHeader);
  let token = authHeader.slice(7); // tar bort "BEARER " från headern
  let decoded;
  try {
    decoded = jwt.verify(token, 'jag är ledsen för att mina föräldrar inte älskar mig')
  } catch (err) {
    console.log(err) //Logga felet, för felsökning på servern.
    res.status(401).send('Invalid auth token')
  }

  let connection = await getDBConnnection()
  let sql = `SELECT * FROM users`   
  let [results] = await connection.execute(sql)

  //res.json() skickar resultat som JSON till klienten
  res.json(results)
});

app.post('/logincheck', async function(req, res) {
  console.log(req.body.first_name)
  
})



app.get('/signup', async function(req, res) {
  res.sendFile(join(__dirname, "coolAF.html"))
})

app.post('/signup', async function(req, res) {
  console.log(req.body.first_name);

  try {
      const { first_name, last_name, username, password } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      let connection = await getDBConnnection();
      let sql = `INSERT INTO users (username, first_name, last_name, password)
                  VALUES (?, ?, ?, ?)`;

      let [results] = await connection.execute(sql, [
          username,
          first_name,
          last_name,
          hashedPassword // Use hashedPassword here, not req.body.password
      ]);

      res.json(results);
  } catch (error) {
      res.status(500).json({ error: "An error occurred while processing your request." });
  }
});

app.get('/login', async function(req, res) {
  res.sendFile(join(__dirname, "loginAD.html"))
})

app.post("/login", async function(req, res) {
  try {
    const { username, password } = req.body;
    let connection = await getDBConnnection();
    let sql = "SELECT id, first_name, last_name, username, password FROM users WHERE username ='" + username +"'";
    let [results] = await connection.execute(sql, [
      username, password
  ]);

    console.log(results[0].password);

    const match = await bcrypt.compare(password, results[0].password);
    if (match){
      let payload = {
        sub: results[0].id,         // sub är obligatorisk
        name: results[0].first_name // Valbar
        // kan innehålla ytterligare attribut, t.ex. roller
      }
      let token = jwt.sign(payload, 'jag är ledsen för att mina föräldrar inte älskar mig')
      console.log(token);
      
      res.send(token)

      res.redirect("/");
    };
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
});
 

app.post('/users', async function(req, res) {
  //req.body innehåller det postade datat
   console.log(req.body)

   if (req.body && req.body.username && req.body.first_name && req.body.last_name && req.body.password) {
    //skriv till databas
    let connection = await getDBConnnection();
    let sql = `INSERT INTO users (username, first_name, last_name, password)
    VALUES (?, ?, ?, ?)`
 
     let [results] = await connection.execute(sql, [
     req.body.username,
     req.body.first_name,
     req.body.last_name,
     req.body.password
   ])
 
   //results innehåller metadata om vad som skapades i databasen
   console.log(results)
   res.json(results)

  } else {
    //returnera med felkod 422 Unprocessable entity.
    //eller 400 Bad Request.
    res.sendStatus(422)
  }
 
   
 });

app.put("/users/:id", async function (req, res) {
  //kod här för att hantera anrop…

  let connection = await getDBConnnection();
  let sql = `UPDATE users
    SET first_name = ?, last_name = ?, username = ?, password = ?
    WHERE id = ?`

  let [results] = await connection.execute(sql, [
    req.body.first_name,
    req.body.last_name,
    req.body.username,
    req.body.password,
    req.params.id,
  ])
  //kod här för att returnera data

  res.json(results);
})




const port = 3000
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})