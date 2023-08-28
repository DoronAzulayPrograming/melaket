<?php
namespace App\Controllers\Api;

use App\Models\Warehouse;
use App\Models\WarehouseValidation;
use App\Repositories\BusinessRepository;
use App\Repositories\WarehouseRepository;
use DafCore\ApiController;
use DafCore\Controller\Attributes as a;
use DafCore\RequestBody;
use DafDb\DateOnly;

#[a\Route(prefix:"api")]
class WarehouseApiController extends ApiController {

    function __construct(public WarehouseRepository $repo, public BusinessRepository $brepo) {

    }

    // GET: /api/Warehouse
    #[a\HttpGet]
    function index(){
        return $this->ok(empty($res = $this->repo->many()) ? "[]" : $res);
    }

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

    // GET: /api/Warehouse/5/5
    #[a\HttpGet(":businessId/:warehouseId")]
    function details(int $businessId, int $warehouseId){
        if(!$this->repo->where("warehouseId","=",$warehouseId)->where("businessId","=",$businessId)->exists()){
            return $this->notFound("warehouse with warehouseId:$warehouseId and businessId:$businessId not found");
        }

        try {
            $warehouse = $this->repo->where("warehouseId","=",$warehouseId)->where("businessId","=",$businessId)->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($warehouse);
    }

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

    // POST: /api/Warehouse
    #[a\HttpPost]
    function create(RequestBody $body){
        $body->id = 0;

        if(!WarehouseValidation::Post($body)){
            return $this->badRequset(WarehouseValidation::$error);
        }

        if(!$this->brepo->where("id","=",$body->businessId)->exists()){
            return $this->badRequset("businessId:$body->businessId is not exists.");
        }

        if($this->repo->where("warehouseId","=",$body->warehouseId)->where("businessId","=",$body->businessId)->exists()){
            return $this->badRequset("warehouse with warehouseId:$body->warehouseId and businessId:$body->businessId is already exists.");
        }

        try {
            $this->repo->insert($body)->execute();
            $res = $this->repo->getLastInserted();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // DELETE: /api/Warehouse/5/5
    #[a\HttpDelete(":businessId/:warehouseId")]
    function delete(int $businessId, int $warehouseId){
        if(!$this->repo->where("warehouseId","=",$warehouseId)->where("businessId","=",$businessId)->exists()){
            return $this->notFound("warehouse with warehouseId:$warehouseId and businessId:$businessId not found");
        }

        try {
            $this->repo->delete()->where("warehouseId","=",$warehouseId)->where("businessId","=",$businessId)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
        
        return $this->noContent();
    }
}
?>