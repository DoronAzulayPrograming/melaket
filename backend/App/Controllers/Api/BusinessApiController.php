<?php
namespace App\Controllers\Api;

use App\Middlewheres\Auth;
use App\Models\Business\Business;
use App\Models\Business\BusinessCreateModel;
use App\Models\Business\BusinessValidation;
use App\Models\CodeBinaBusinessProfile;
use App\Models\Data\KonimboData;
use App\Models\Model\Model;
use App\Repositories\BusinessRepository;
use App\Repositories\CodeBinaBusinessProfilesRepository;
use App\Repositories\ModelsRepository;
use App\Repositories\UsersRepository;
use App\Repositories\WarehousesRepository;
use DafCore\ApiController;
use DafCore\Controller\Attributes as a;
use DafCore\Request;
use DafCore\RequestBody;

#[a\Route(prefix:"api")]
class BusinessApiController extends ApiController {
    private array $models = ["קונימבו"=>KonimboData::class];

    function __construct(
        public BusinessRepository $repo,
        public UsersRepository $urepo,
        public ModelsRepository $mrepo,
        public WarehousesRepository $wrepo,
        public CodeBinaBusinessProfilesRepository $binaRepo
    ) {}

    // GET: /api/Business
    #[a\HttpGet]
    function index(string $q = null){
        if(empty($q)){
            $res = $this->repo->include("codeBina")->include("models")->include("users")->include("warehouses")->orderBy("Business.id")->many();
            return $this->ok(empty($res) ? "[]" : $res);
        }
        $prop = "name";
        if (is_numeric($q)) {
            $prop = "id";
        }
        return $this->ok(empty($res = $this->repo->where($prop,"LIKE",$q."%")->many()) ? "[]" : $res);
    }

    // GET: /api/Business/current
    #[Auth(["subAdmin","manager","member"])]
    #[a\HttpGet("current")]
    function current(Request $req){
        $id = $req->user->businessId;

        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("עסק עם מזהה $id לא קיים במערכת");
        }

        try {
            $business = $this->repo
            ->include("warehouses")
            ->include("codeBina")
            ->include("models")
            ->where("id","=",$id)
            ->single(false);
            $business["users"] = $this->urepo->include("warehouses")->thenInclude("warehouse")->where("businessId","=", $id)->many();

            /*$business["users"] = array_map(function($user){
                unset($user['password']);
                $user['roles'] = explode(",",$user['roles']);
                return $user;
            },$business["users"]);*/

            $business["models"] = array_map(function($model){
                $m = new Model($model);
                unset($model->{'price'});
                unset($model->{'lastPayDate'});
                return $m;
            },$business["models"]);

        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($business);
    }

    // GET: /api/Business/5
    #[a\HttpGet(":id")]
    function details(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("עסק עם מזהה $id לא קיים במערכת");
        }

        try {
            $business = $this->repo->include("models")->include("users")->where("id","=",$id)->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($business);
    }

    // PUT: /api/Business/5
    #[a\HttpPut(":id")]
    function update(int $id, RequestBody $body){

        if(!isset($body->id) || $body->id != $id)
            return $this->badRequset("מזהה ומזהה בגוף הבקשה צריכים להיות שווים.!");

        if(!$this->repo->existsWhere("id","=",$id)) 
            return $this->notFound("עסק עם מזהה $id לא קיים במערכת");
        

        $model_vars = get_class_vars(Business::class);
        unset($model_vars['users']);
        unset($model_vars['models']);
        unset($model_vars['warehouses']);

        foreach ($body as $key => $value) {
            if(!array_key_exists($key, $model_vars)) {
                return $this->badRequset("בקשה מכילה תכונות לא ידועות");
            }
        }

        if(isset($body->createDate)) 
            unset($body->createDate);

        if(!BusinessValidation::Put($body)){
            return $this->badRequset(BusinessValidation::$error);
        }

        if(isset($body->email) && $this->repo->where("email", "=", $body->email)->where("id","!=",$id)->exists())
            return $this->badRequset("אימייל כבר קיים במערכת.");

        try {
            $this->repo->update($body)->where("id","=",$id)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->noContent();
    }

    // POST: /api/Business
    #[a\HttpPost]
    function create(BusinessCreateModel $body){
        if(isset($body->codeBina))
            $codeBina = \DafCore\ObjectMapper::map($body->codeBina, new CodeBinaBusinessProfile());
            
        if($this->repo->existsWhere("name","=", $body->name)){
            return $this->badRequset("שם עסק קיים במערכת.!");
        }

        //validate jsonData manual
        try {
            $n = null;
            foreach ($body->models as $model) {
                if($model->jsonData === "{}") continue;
                
                $class_name = $this->models[$model->name];
                $n = new \DafCore\JsonValidateClass($class_name);

                if(!$n->validate("jsonData", $model->jsonData, "נתונים נוספים")){
                    return $this->badRequset($n->msg);
                }
            }
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        $business = \DafCore\ObjectMapper::map($body, new Business());

        try {
            $this->repo->insert($business)->execute();
            $businessId = $this->repo->lastInsertId();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        if(isset($codeBina)){
            try {
                $codeBina->businessId = $businessId;
                $this->binaRepo->insert($codeBina)->execute();
            } catch (\Exception $ex) {
                return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
            }
        }

        try {
            foreach ($body->models as $model) {
                $model->businessId = $businessId;
                $this->mrepo->insert($model)->execute();
            }
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        try {
            foreach ($body->warehouses as $warehouse) {
                //$w = new Warehouse(0, $businessId, $warehouse->id, $warehouse->name);
                $w = ["id"=>0,"businessId"=>$businessId,"warehouseId"=>$warehouse->id, "warehouseName"=>$warehouse->name];
                $this->wrepo->insert($w)->execute();
            }
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        $res = $this->repo->include("codeBina")->include("models")->include("warehouses")->where("id","=",$businessId)->single();
        return $this->ok($res);
    }

    // DELETE: /api/Business/5
    #[a\HttpDelete(":id")]
    function delete(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("עסק עם מזהה $id לא קיים במערכת");
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