<?php
namespace App\Controllers\Api;

use App\Middlewheres\Auth;
use App\Models\Warehouse;
use App\Models\WarehouseValidation;
use App\Repositories\BusinessRepository;
use App\Repositories\WarehousesRepository;
use DafCore\ApiController;
use DafCore\Controller\Attributes as a;
use DafCore\Request;
use DafCore\RequestBody;

#[a\Route(prefix:"api")]
class WarehousesApiController extends ApiController {

    function __construct(
        public WarehousesRepository $repo,
        public BusinessRepository $brepo) {}

    #[Auth]
    #[a\HttpGet]
    function index(Request $req){
        if(in_array("admin",$req->user->roles)){
            $res = $this->repo
            ->many();
        }else{
            $res = $this->repo
            ->where("businessId","=", $req->user->businessId)
            ->many();
        }
        
        return $this->ok(empty($res) ? "[]" : $res);
    }

    #[Auth]
    #[a\HttpGet("/business/:businessId")]
    function businessWarehouses(Request $req, int $businessId){
        if(!in_array("admin",$req->user->roles)){

            $res = $this->repo
            ->where("businessId","=", $req->user->businessId)
            ->many();
        
        }
        else {
            $res = $this->repo
            ->where("businessId","=", $businessId)
            ->many();
        }
        return $this->ok(empty($res) ? "[]" : $res);
    }

    // GET: /api/Warehouse
    #[a\HttpGet("full")]
    function indexFull(){
        $res = $this->repo
        ->include("users")
        ->thenInclude("user")
        ->include("business")
        ->many();
        
        return $this->ok(empty($res) ? "[]" : $res);
    }

/*
    // GET: /api/Warehouse/5
    #[a\HttpGet(":businessId")]
    function details_all(int $businessId){
        if(!$this->repo->where("businessId","=",$businessId)->exists()){
            return $this->notFound("warehouses with businessId:$businessId not found");
        }
    
        try {
            $warehouses = $this->repo->where("businessId","=",$businessId)->many();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
    
        return $this->ok($warehouses);
    }

*/

    // GET: /api/Warehouse/5
    #[a\HttpGet(":id")]
    function details(int $id){

        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("מחסן עם מזהה:$id לא קיים במערכת.!");
        }

        try {
            $warehouse = $this->repo
            ->include("users")
            ->thenInclude("user")
            ->include("business")
            ->where("id","=",$id)
            ->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($warehouse);
    }

/*

    // PUT: /api/Warehouse/5/5
    #[a\HttpPut(":businessId/:warehouseId")]
    function update(int $businessId, int $warehouseId, RequestBody $body){
        if(!isset($body->businessId) || $body->businessId != $businessId) {
            return $this->badRequset("businessId and body businessId not match.!");
        }

        if(!isset($body->warehouseId) || $body->warehouseId != $warehouseId) {
            return $this->badRequset("warehouseId and body warehouseId not match.!");
        }

        if(!$this->repo->where("warehouseId","=",$warehouseId)->where("businessId","=",$businessId)->exists()){
            return $this->notFound("warehouse with warehouseId:$warehouseId and businessId:$businessId not found");
        }

        $model_vars = get_class_vars(Warehouse::class);
        foreach ($body as $key => $value) {
            if(!array_key_exists($key, $model_vars)) {
                return $this->badRequset("body include unknown props.!");
            }
        }

        if(!WarehouseValidation::Put($body)){
            return $this->badRequset(WarehouseValidation::$error);
        }

        try {
            $this->repo->update($body)->where("warehouseId","=",$warehouseId)->where("businessId","=",$businessId)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->noContent();
    }

*/

    // PUT: /api/Warehouse/5
    #[Auth(["admin","subAdmin","manager"])]
    #[a\HttpPut(":id/:businessId")]
    function update(Request $req, int $id, int $businessId,  RequestBody $body){
        if(!isset($body->id) || $body->id != $id) {
            return $this->badRequset("מזהה ומזהה בגוף הבקשה אינם תואמים.!");
        }

        if(!in_array("admin", $req->user->roles))
            $body->businessId = $businessId = $req->user->businessId;

        if(!isset($body->businessId) || $body->businessId != $businessId) {
            return $this->badRequset("מזהה עסק ומזהה עסק בגוף הבקשה אינם תואמים.!");
        }
        
        if(!$this->brepo->where("id","=",$body->businessId)->exists()){
            return $this->badRequset("עסק עם מזהה ".$body->businessId." לא קיים במערכת");
        }

        if(!$this->repo->where("id","=",$id)->where("businessId","=",$businessId)->exists()){
            return $this->notFound("מחסן עם מזהה:$id לא קיים בעסק:$businessId");
        }

        if(isset($body->warehouseId)){
            if($this->repo->where("warehouseId","=",$body->warehouseId)->where("businessId","=",$body->businessId)->where("id","!=", $id)->exists()){
                return $this->badRequset("מזהה מחסן קוד בינה ".$body->warehouseId." כבר קיים בעסק ".$body->businessId.".");
            }
        }

        if(isset($body->warehouseName)){
            if($this->repo->where("warehouseName","=",$body->warehouseName)->where("businessId","=",$body->businessId)->where("id","!=", $id)->exists()){
                return $this->badRequset("שם מחסן ".$body->warehouseName." כבר קיים בעסק ".$body->businessId.".");
            }
        }
    
        $model_vars = get_class_vars(Warehouse::class);
        unset($model_vars["business"]);
        foreach ($body as $key => $value) {
            if(!array_key_exists($key, $model_vars)) {
                return $this->badRequset("גוף בקשה מכיל תכונות לא ידועות.!");
            }
        }
    
        if(!WarehouseValidation::Put($body)){
            return $this->badRequset(WarehouseValidation::$error);
        }
    
        try {
            $this->repo->update($body)->where("id","=",$id)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
    
        return $this->noContent();
    }

    // POST: /api/Warehouse
    #[Auth(["admin","subAdmin","manager"])]
    #[a\HttpPost]
    function create(Request $req, Warehouse $body){
        $body->id = 0;
        if(!in_array("admin", $req->user->roles))
            $body->businessId = $req->user->businessId;

        if(!$this->brepo->where("id","=",$body->businessId)->exists()){
            return $this->badRequset("עסק עם מזהה ".$body->businessId." לא קיים במערכת");
        }

        if($this->repo->where("warehouseId","=",$body->warehouseId)->where("businessId","=",$body->businessId)->exists()){
            return $this->badRequset("מזהה מחסן קוד בינה ".$body->warehouseId." כבר קיים בעסק ".$body->businessId.".");
        }

        if($this->repo->where("warehouseName","=",$body->warehouseName)->where("businessId","=",$body->businessId)->exists()){
            return $this->badRequset("שם מחסן ".$body->warehouseName." כבר קיים בעסק ".$body->businessId.".");
        }

        try {
            $this->repo->insert($body)->execute();
            $res = $this->repo->getLastInserted();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // DELETE: /api/Warehouse/5
    #[Auth(["admin","subAdmin","manager"])]
    #[a\HttpDelete(":id")]
    function delete(Request $req, int $id){
        if(!in_array("admin",$req->user->roles)){
            $businessId = $req->user->businessId;
            if(!$this->repo->where("id","=",$id)->where("businessId","=",$businessId)->exists()){
                return $this->notFound("מחסן $id לא קיים בעסק $businessId.");
            }
        }

        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("מחסן עם מזהה $id לא קיים במערכת");
        }

        try {
            $this->repo->delete()->where("id","=",$id)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
        
        return $this->noContent();
    }
}
?>