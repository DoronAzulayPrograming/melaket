<?php
namespace App\Controllers\Api;

use App\Middlewheres\Auth;
use App\Models\CodeBinaBusinessProfile;
use App\Models\CodeBinaBusinessProfileValidation;
use App\Repositories\CodeBinaBusinessProfilesRepository;
use DafCore\ApiController;
use DafCore\Application;
use DafCore\Controller\Attributes as a;
use DafCore\Request;
use DafCore\RequestBody;

#[a\Route(prefix:"api")]
class CodeBinaBusinessProfilesApiController extends ApiController {

    function __construct(
        public CodeBinaBusinessProfilesRepository $repo
    ) {}

    // GET: /api/CodeBinaBusinessProfiles
    #[a\HttpGet]
    function index(){
        $res = $this->repo->include("business")->many();
        return $this->ok(empty($res) ? "[]" : $res);
    }

/*
    // GET: /api/CodeBinaBusinessProfiles/5
    #[a\HttpGet(":id")]
    function details(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("פרופיל קוד בינה $id לא קיים במערכת");
        }

        try {
            $res = $this->repo->include("business")->where("id","=",$id)->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
        
        return $this->ok($res);
    }
*/

    // PUT: /api/CodeBinaBusinessProfiles/5
    #[Auth(["admin","subAdmin","manager"])]
    #[a\HttpPut(":id")]
    function update(Request $req, int $id, RequestBody $body){
        if(!in_array("admin",$req->user->roles))
            $body->businessId = $id = $req->user->businessId;
            
        if(!isset($body->businessId) || $body->businessId != $id)
            return $this->badRequset("מזהה ומזהה בגוף הבקשה צריכים להיות שווים.!");

        if(!$this->repo->existsWhere("businessId","=",$id)) 
            return $this->notFound("עסק עם מזהה $id לא קיים במערכת");
        
        $model_vars = get_class_vars(CodeBinaBusinessProfile::class);
        unset($model_vars['business']);
    
        foreach ($body as $key => $value) {
            if(!array_key_exists($key, $model_vars)) {
                return $this->badRequset("בקשה מכילה תכונות לא ידועות");
            }
        }

        if(isset($body->createDate)) 
            unset($body->createDate);

        if(!CodeBinaBusinessProfileValidation::Put($body)){
            return $this->badRequset(CodeBinaBusinessProfileValidation::$error);
        }

        try {
            $this->repo->update($body)->where("businessId","=",$id)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
        
        return $this->noContent();
    }

    // POST: /api/CodeBinaBusinessProfiles
    #[Auth(["admin","subAdmin","manager"])]
    #[a\HttpPost]
    function create(Request $req, CodeBinaBusinessProfile $body){
        if(!in_array("admin",$req->user->roles))
            $body->businessId = $req->user->businessId;

        if(!isset($body->businessId) || empty($body->businessId))
            return $this->badRequset("שדה מזהה הינו שדה חובה");

        if($this->repo->existsWhere("businessId","=", $body->businessId))
            return $this->badRequset("נתוני קוד בינה כבר קיימים במערכת.!");

        try {
            $this->repo->insert($body)->execute();
            $res =  $this->repo->include("business")->where("businessId","=",$body->businessId)->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }
    
/*
    // DELETE: /api/CodeBinaBusinessProfiles/5
    #[a\HttpDelete(":id")]
    function delete(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("פרופיל קוד בינה $id לא קיים במערכת");
        }

        try {
            $this->repo->delete()->where("id","=",$id)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
        
        return $this->noContent();
    }
*/
}
?>