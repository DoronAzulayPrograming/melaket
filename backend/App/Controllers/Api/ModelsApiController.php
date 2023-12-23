<?php
namespace App\Controllers\Api;

use App\Middlewheres\Auth;
use App\Models\Data\KonimboData;
use App\Models\Model\Model;
use App\Models\Model\ModelCreateModel;
use App\Repositories\BusinessRepository;
use App\Repositories\ModelsRepository;
use App\Services\BackgroundDataService;
use DafCore\ApiController;
use DafCore\Controller\Attributes as a;
use DafCore\Request;
use DafCore\RequestBody;

#[a\Route(prefix:"api")]
class ModelsApiController extends ApiController {
    private array $models = ["קונימבו"=>KonimboData::class];

    function __construct(
        public ModelsRepository $repo,
        public BusinessRepository $brepo,
        public BackgroundDataService $bgDataService,
    ) {}

    #[a\HttpGet("load-konimbo")]
    #[Auth(["subAdmin","manager","member"])]
    function loadKonimbo(Request $req){

        try {
            // $this->bgDataService->loadBusiness($req->user->businessId);
            // $this->bgDataService->loadCheetah($req->user->businessId);
            $res = $this->bgDataService->getBusiness($req->user->businessId);
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // GET: /api/Models
    #[a\HttpGet]
    function index(){
        $list = $this->repo->include("business")->many();
        if(empty($list))
            return $this->ok("[]");
        return $this->ok($list);
    }

    // GET: /api/Models/5
    #[a\HttpGet(":id")]
    function details(int $id){
        if(!$this->repo->existsWhere("id","=", $id))
            return $this->notFound("מודל עם מזהה $id לא נמצא.");

        $obj = $this->repo->include("business")->where("id","=", $id)->single();
        
        return $this->ok($obj);
    }

    // PUT: /api/Models/5
    #[a\HttpPut(":id")]
    function update(int $id, RequestBody $body){

        if(!isset($body->id) || $body->id != $id)
            return $this->badRequset("מזהה ומזהה בגוף הבקשה צריכים להיות שווים.!");

        if(!$this->repo->existsWhere("id","=", $id))
            return $this->notFound("מודל עם מזהה $id לא נמצא.");
        
        if(isset($body->createDate))
            unset($body->createDate);
        
        if(isset($body->name)){
            if(!array_key_exists($body->name, $this->models))
                return $this->badRequset("שדה שם מכיל ערך לא ידוע.");
        }
        
        if(isset($body->jsonData)){
            if(!is_string($body->jsonData))
                return $this->badRequset("תאריך נתונים נוספים הינו שדה מסוג טקסט.");

            if(empty($body->jsonData))
                return $this->badRequset("שדה נתונים נוספים לא יכול להכיל ערך ריק.");


            //validate jsonData manual
            try {
                    if($body->jsonData !== "{}"){
                        $class_name = $this->models[$body->name];
                        $n = new \DafCore\JsonValidateClass($class_name);

                        if(!$n->validate("jsonData", $body->jsonData, "נתונים נוספים")){
                            return $this->badRequset($n->msg);
                        }
                    }
                    
            } catch (\Exception $ex) {
                return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
            }

            
            /*
                $data = json_decode($body->jsonData);
                if(!$data)
                    return $this->badRequset("שדה נתונים נוספים מכיל ערך לא תקין להמרה.");
            */
        }
        
        if(isset($body->businessId)){
            if(empty($body->businessId))
                return $this->badRequset("שדה מזהה עסק לא יכול להכיל ערך ריק.");

            if(!$this->brepo->existsWhere("id","=",$body->businessId))
                return $this->notFound("עסק עם מזהה ".$body->businessId." לא קיים במערכת");
        }

        if (isset($body->lastPayDate))
        {
            if(!is_string($body->lastPayDate))
                return $this->badRequset("תאריך תשלום אחרון הינו שדה מסוג טקסט.");

            if(!$this->isValidDate($body->lastPayDate))
                return $this->badRequset("תאריך לא תקין.");
        }

        $model_vars = get_class_vars(Model::class);

        foreach ($body as $key => $value) {
            if(!array_key_exists($key, $model_vars))
                return $this->badRequset("בקשה מכילה תכונות לא ידועות");
        }

        try {
            $this->repo->update($body)->where("id","=", $id)->execute();
            $res = $this->repo->include("business")->where("id","=", $id)->single();
        } catch (\Throwable $th) {
            $this->internalError($th->getMessage());
        }

        return $this->ok($res);
    }

    // POST: /api/Models
    #[a\HttpPost]
    function create(ModelCreateModel $body){

        if(!array_key_exists($body->name, $this->models))
            return $this->badRequset("שדה שם מכיל ערך לא ידוע.");

        if(!$this->brepo->existsWhere("id","=",$body->businessId))
            return $this->notFound("עסק עם מזהה ".$body->businessId." לא קיים במערכת");

        if($this->repo->where("businessId","=",$body->businessId)->where("name", "=", $body->name)->exists())
            return $this->notFound("מודל כבר קיים במערכת");

        if (!is_string($body->jsonData))
            return $this->badRequset("תאריך נתונים נוספים הינו שדה מסוג טקסט.");

        $data = json_decode($body->jsonData);
        if (!$data)
            return $this->badRequset("שדה נתונים נוספים מכיל ערך לא תקין להמרה.");

        try {
            $this->repo->insert($body)->execute();
            $res = $this->repo->getLastInserted();
        } catch (\Throwable $th) {
            $this->internalError($th->getMessage());
        }

        return $this->ok($res);
    }

    // DELETE: /api/Models/5
    #[a\HttpDelete(":id")]
    function delete(int $id){
        if(!$this->repo->existsWhere("id","=", $id))
            return $this->notFound("מודל עם מזהה $id לא קיים במערכת.");

        try {
            $this->repo->delete()->where("id","=", $id)->execute();
        } catch (\Throwable $th) {
            $this->internalError($th->getMessage());
        }

        return $this->noContent();
    }

    function isValidDate($date, $format = 'Y-m-d') {
        $d = \DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
}
?>