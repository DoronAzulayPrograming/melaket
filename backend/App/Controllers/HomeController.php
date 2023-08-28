<?php
namespace App\Controllers;

use DafCore\Controller;
use DafCore\Controller\Attributes as a;
use DafCore\RequestBody;

#[a\Route("/")]
class HomeController extends Controller {

    function __construct() {
        // TODO Code 
    }

    // GET: /Home
    #[a\HttpGet]
    function index(){
        // TODO Code
        return $this->view("index");
    }

    // GET: /Home/5
    #[a\HttpGet(":id")]
    function details(int $id){
        // TODO Code 
        echo "<h1>Hello From Products Details $id</h1>";
    }

    // POST: /Home
    #[a\HttpPost]
    function create(RequestBody $body){
        // TODO Code 
    }

    // POST: /Home/5
    #[a\HttpPost(":id")]
    function update(int $id, RequestBody $body){
        // TODO Code 
    }

    // POST: /Home/delete/5
    #[a\HttpPost("delete/:id")]
    function delete(int $id){
        // TODO Code 
    }
}
?>