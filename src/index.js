const express = require('express');
const {v4: uuidv4} = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF(request, response, next) {
  const {cpf} = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer){
    return response.status(400).json({error: "customer not found"})
  }

  request.customer = customer;

  return next();
}

function getBalance(statement){
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit'){
      return acc + operation.value;
    } else {
      return acc - operation.value;
    }
  }, 0);

  return balance;

}

app.get('/', (request,response) => {
  return response.send("finapi");
})

app.post('/account', (request, response) => {
  const {cpf, name} = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists){
    return response.status(400).json({error: "customer already Exists"});
  }
  
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement : []
  })

  return response.status(201). send();

})
//update account
app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const {name} = request.body;
  const {customer} = request;

  customer.name = name;

  return response.status(201).send();
})

app.get('/statement', verifyIfExistsAccountCPF, (request,response) => {
  const {customer} = request;
  return response.json(customer.statement)
})

//return all accounts
app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const customer = request;
  
  return response.json(customers);
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response)=> {
  const { customer } = request;
  const { date }  = request.query;

  const dateFormat = new Date(date + " 00:00");
  
  const statement = customer.statement.filter(
      (statement) => (statement.created_at) === new Date(dateFormat));

return response.json(customer.statement);
});


app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const {description, amount} = request.body;

  const {customer} = request;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation);
  return response.status(201).send();
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const {amount} = request.body;

  const {customer} = request;

  const balance = getBalance(customer.statement);

  if(balance < amount){
    return response.status(400).json({error: "Saldo insuficiente"})
  }

  const statementOperation = {
    description: "Saque",
    amount,
    createdAt: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation);
  return response.status(200).send();
})

//delete account
app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request;

  const index = customers.indexOf(customer);

  customers.splice(index, 1);

  return response.status(200).send();
})

//show all accounts
app.get('/accounts', (request, response) => {
  return response.json(customers);
})

//get account balance
app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request;

  const balance = getBalance(customer.statement);

  return response.json({balance});
})

app.listen(3333); 