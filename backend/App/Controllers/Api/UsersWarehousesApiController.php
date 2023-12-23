<?php
namespace App\Controllers\Api;

use App\Models\UserWarehouse;
use App\Repositories\UsersRepository;
use App\Repositories\UsersWarehousesRepository;
use App\Repositories\WarehousesRepository;
use DafCore\ApiController;
use DafCore\Controller\Attributes as a;
use DafCore\RequestBody;

#[a\Route(prefix:"api")]
class UsersWarehousesApiController extends ApiController {

    function __construct(
        public UsersRepository $urepo,
        public WarehousesRepository $wrepo,
        public UsersWarehousesRepository $repo) {}

    // GET: /api/UsersWarehouses
    #[a\HttpGet]
    function index(){
        return $this->ok(empty($res = $this->repo->include("user")->include("warehouse")->many()) ? "[]" : $res);
    }

    // GET: /api/UsersWarehouses/5
    #[a\HttpGet(":userId/:warehouseId")]
    function details(int $userId, int $warehouseId){
        if(!$this->urepo->existsWhere("id","=",$userId)){
            return $this->badRequset("משתמש לא קיים במערכת");
        }
        if(!$this->wrepo->existsWhere("id","=",$warehouseId)){
            return $this->badRequset("מחסם לא קיים במערכת");
        }
        
        if(!$this->repo->where("userId","=",$userId)->where("warehouseId","=",$warehouseId)->exists()){
            return $this->badRequset("מחסן לא קיים אצל המתשמש");
        }

        try {
            $res = $this->repo
            ->include("user")->include("warehouse")
            ->where("userId","=",$userId)->where("warehouseId","=",$warehouseId)
            ->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // POST: /api/UsersWarehouses
    #[a\HttpPost]
    function create(UserWarehouse $body){
        if(!$this->urepo->existsWhere("id","=",$body->userId)){
            return $this->badRequset("משתמש לא קיים במערכת");
        }
        if(!$this->wrepo->existsWhere("id","=",$body->warehouseId)){
            return $this->badRequset("מחסן לא קיים במערכת");
        }

        if($this->repo->where("userId","=",$body->userId)->where("warehouseId","=",$body->warehouseId)->exists()){
            return $this->badRequset("מחסן קיים אצל המתשמש");
        }

        try {
            $this->repo->insert($body)->execute();
            $res = $this->repo
            ->include("user")->include("warehouse")
            ->where("userId","=",$body->userId)->where("warehouseId","=",$body->warehouseId)
            ->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // DELETE: /api/UsersWarehouses/5
    #[a\HttpDelete(":userId/:warehouseId")]
    function delete(int $userId, int $warehouseId){
        if(!$this->urepo->existsWhere("id","=",$userId)){
            return $this->badRequset("משתמש לא קיים במערכת");
        }
        if(!$this->wrepo->existsWhere("id","=",$warehouseId)){
            return $this->badRequset("מחסם לא קיים במערכת");
        }

        if(!$this->repo->where("userId","=",$userId)->where("warehouseId","=",$warehouseId)->exists()){
            return $this->badRequset("מחסן לא קיים אצל המתשמש");
        }

        try {
            $this->repo->delete()->where("userId","=",$userId)->where("warehouseId","=",$warehouseId)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->noContent();
    }
}
?>