<?php
namespace App\Controllers;

use DafCore\Controller;
use DafCore\Controller\Attributes as a;
use DafCore\RequestBody;

#[a\Route]
class JsPrintManagerController extends Controller {

    function __construct() {
        // TODO Code 
    }

    // GET: /JsPrintManager
    #[a\HttpGet]
    function index(){
        return $this->view("index");
    }

    // GET: /JsPrintManager/5
    #[a\HttpGet(":id")]
    function details(int $id){
        // TODO Code 
        echo "<h1>Hello From Products Details $id</h1>";
    }

    // POST: /JsPrintManager
    #[a\HttpPost]
    function create(RequestBody $body){
        // TODO Code 
    }

    // POST: /JsPrintManager/5
    #[a\HttpPost(":id")]
    function update(int $id, RequestBody $body){
        // TODO Code 
    }

    // POST: /JsPrintManager/delete/5
    #[a\HttpPost("delete/:id")]
    function delete(int $id){
        // TODO Code 
    }
}
?>