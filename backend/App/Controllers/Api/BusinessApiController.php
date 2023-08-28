<?php
namespace App\Controllers\Api;

use App\Models\Business;
use App\Models\BusinessValidation;
use App\Repositories\BusinessRepository;
use DafCore\ApiController;
use DafCore\Controller\Attributes as a;
use DafCore\RequestBody;
use DafDb\DateOnly;

#[a\Route(prefix:"api")]
class BusinessApiController extends ApiController {

    function __construct(public BusinessRepository $repo) {

    }

    // GET: /api/Business
    #[a\HttpGet]
    function index(string $q = null){
        if(empty($q)){
            $res = $this->repo->include("users")->many();
            return $this->ok(empty($res) ? "[]" : $res);
        }
        $prop = "name";
        if (is_numeric($q)) {
            $prop = "id";
        }
        return $this->ok(empty($res = $this->repo->where($prop,"LIKE",$q."%")->many()) ? "[]" : $res);
    }

    // GET: /api/Business/5
    #[a\HttpGet(":id")]
    function details(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("business with id:$id not found");
        }

        try {
            $business = $this->repo->include("users")->where("id","=",$id)->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($business);
    }

    // PUT: /api/Business/5
    #[a\HttpPut(":id")]
    function update(int $id, RequestBody $body){
        if(!isset($body->id) || $body->id != $id) {
            return $this->badRequset("id and body id not match.!");
        }

        if(!$this->repo->existsWhere("id","=",$id)) {
            return $this->notFound("business with id:$id not found");
        }

        $model_vars = get_class_vars(Business::class);
        foreach ($body as $key => $value) {
            if(!array_key_exists($key, $model_vars)) {
                return $this->badRequset("body include unknown props.!");
            }
        }

        if(isset($body->createDate)) 
            unset($body->createDate);

        if(!BusinessValidation::Put($body)){
            return $this->badRequset(BusinessValidation::$error);
        }

        if(isset($body->email) && $this->repo->where("email", "=", $body->email)->where("id","!=",$id)->exists())
            return $this->badRequset("Email is already exists in the database.");

        try {
            $this->repo->update($body)->where("id","=",$id)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->noContent();
    }

    // POST: /api/Business
    #[a\HttpPost]
    function create(RequestBody $body){
        $body->id = 0;
        $body->createDate = DateOnly::Now();

        if(!BusinessValidation::Post($body)){
            return $this->badRequset(BusinessValidation::$error);
        }

        if($this->repo->existsWhere("email","=", $body->email)){
            return $this->badRequset("email already exist.!");
        }

        try {
            $this->repo->insert($body)->execute();
            $res = $this->repo->getLastInserted();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // DELETE: /api/Business/5
    #[a\HttpDelete(":id")]
    function delete(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("business with id:$id not found");
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