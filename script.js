
function validateLogin(){

let username=document.getElementById("username").value;
let password=document.getElementById("password").value;

if(username=="" || password==""){
alert("Please enter username and password");
return false;
}

window.location="search.html";
return false;

}

function selectSeat(seat){

if(seat.classList.contains("selected")){
seat.classList.remove("selected");
}
else{
seat.classList.add("selected");
}

}

function savePassenger(){

let name=document.getElementById("name").value;
let age=document.getElementById("age").value;
let phone=document.getElementById("phone").value;

if(name=="" || age=="" || phone==""){
alert("Please fill all passenger details");
return;
}

localStorage.setItem("name",name);
localStorage.setItem("age",age);
localStorage.setItem("phone",phone);

window.location="payment.html";

}

function showTicket(){

let name=localStorage.getItem("name");
let age=localStorage.getItem("age");
let phone=localStorage.getItem("phone");

document.getElementById("pname").innerText="Name: "+name;
document.getElementById("page").innerText="Age: "+age;
document.getElementById("pphone").innerText="Phone: "+phone;

}

function downloadTicket(){

const { jsPDF } = window.jspdf;
const doc=new jsPDF();

doc.setFontSize(18);
doc.text("Bus Reservation Ticket",20,20);

doc.setFontSize(12);
doc.text("Name: "+localStorage.getItem("name"),20,50);
doc.text("Age: "+localStorage.getItem("age"),20,60);
doc.text("Phone: "+localStorage.getItem("phone"),20,70);

doc.text("Status: Confirmed",20,90);

doc.save("bus_ticket.pdf");

}

