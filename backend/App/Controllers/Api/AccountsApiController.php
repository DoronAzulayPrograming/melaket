<?php
namespace App\Controllers\Api;

use App\Models\Business;
use App\Models\User;
use App\Models\UserCreateModel;
use App\Models\UserValidation;
use App\Repositories\UsersRepository;
use DafCore\ApiController;
use DafCore\Controller\Attributes as a;
use DafCore\RequestBody;
use DafDb\DateOnly;
use App\Middlewheres\Auth;
use App\Repositories\BusinessRepository;
use App\Services\JwtService;
use DafCore\Request;

#[a\Route(prefix:"api")]
class AccountsApiController extends ApiController {
    private array $roles = ["admin"=>1,"subAdmin"=>1,"manager"=>1,"member"=>1];

    function __construct(
        public JwtService $jwt,
        public UsersRepository $repo,
        public BusinessRepository $brepo,
    ) { }

    // GET: /api/Accounts
    #[a\HttpGet]
    function index(){
        $res = $this->repo
        ->include("business")
        ->thenInclude("models")
        ->orderBy("Users.id")
        ->many();

        if(empty($res))
            return $this->ok("[]");
            
        return $this->ok($res);
    }

    // GET: /api/Accounts/current
    #[Auth]
    #[a\HttpGet("current")]
    function current(Request $req){
        $id = $req->user->businessId;

        if(!$this->brepo->existsWhere("id","=",$id)){
            return $this->notFound("עסק עם מזהה $id לא קיים במערכת");
        }

        try {
            $res = $this->repo
            ->include("business")
            ->thenInclude("models")
            ->thenInclude("codeBina")
            ->include("warehouses")
            ->thenInclude("warehouse")
            ->where("id","=",$req->user->id)
            ->orderBy("Users.id")
            ->single();
            
            /*$business["users"] = array_map(function($user){
                unset($user['password']);
                $user['roles'] = explode(",",$user['roles']);
                return $user;
            },$business["users"]);*/

           /* $res->business->models = array_map(function($model){
                unset($model->price);
                unset($model->lastPayDate);
                return $model;
            }, $res->business->models);*/

        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // GET: /api/Accounts/current
    #[Auth]
    #[a\HttpGet("auth")]
    function minCurrent(Request $req){
        try {
            $user = $req->user;

            $json = json_encode($user);
            $user = json_decode($json, true);
            
            unset($user["password"]);
            unset($user["createDate"]);
            $user['token'] = $this->jwt->generateToken($user);
            $user['expiryTime'] = $this->jwt->get_last_expiration_time();
        
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($user);
    }

    // GET: /api/Accounts/5
    #[a\HttpGet(":id")]
    function details(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("משתמש עם מזהה $id לא נימצא");
        }

        try {
            $user = $this->repo
            ->include("warehouses")
            ->thenInclude("warehouse")
            ->include("business")
            ->thenInclude("models")
            ->thenInclude("codeBina")
            ->orderBy("Users.id")
            ->where("id","=",$id)
            ->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
        
        return $this->ok($user);
    }

    // PUT: /api/Accounts/5
    #[Auth(["admin","subAdmin","manager"])]
    #[a\HttpPut(":id")]
    function update(Request $req, int $id, RequestBody $body){
        if(!in_array("admin",$req->user->roles)){
            if(!$this->repo->where("id","=",$id)->where("businessId","=",$req->user->businessId)->exists())
                return $this->badRequset("משתמש $id לא קיים בעסק ".$req->user->businessId);
            if(!in_array("subAdmin",$req->user->roles)){
                if($this->repo->where("id","=",$id)->where("roles","LIKE", "%subAdmin%")->exists())
                    return $this->badRequset("אין לך הרשאה לערוך משתמש זה.!");
            }
        }

        if(!isset($body->id) || $body->id != $id)
            return $this->badRequset("מזהה ומזהה בגוף הבקשה צריכים להיות שווים.!");

        /*if(isset($body->password))
            unset($body->password);*/
            
        if(isset($body->password)){
            $body->password = $this->hash_password($body->password);
        }

        if(isset($body->createDate))
            unset($body->createDate);

        if(isset($body->roles)){
            if(!is_array($body->roles))
                return $this->badRequset("roles need to be array of strings.!");

            if(count($body->roles) < 1)
                return $this->badRequset("roles need to include at least one value");

            foreach ($body->roles as $role) {
                if(!array_key_exists($role, $this->roles))
                    return $this->badRequset("בקשה מכילה הרשאות לא ידועות");
            }

            $body->roles = implode(",", $body->roles);
        }

        $model_vars = get_class_vars(User::class);

        foreach ($body as $key => $value) {
            if(!array_key_exists($key, $model_vars))
                return $this->badRequset("בקשה מכילה תכונות לא ידועות");
        }

        try {
            $this->repo->update($body)->where("id","=",$id)->execute();
            $res = $this->repo->include("business")->where("id","=",$id)->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // POST: /api/Accounts
    #[a\HttpPost]
    function create(UserCreateModel $body){

        $body->createDate = DateOnly::Now();

        foreach ($body->roles as $role) {
            if(!array_key_exists($role, $this->roles))
                return $this->badRequset("הרשאות מכילות הרשאה לא ידוע");
        }

        if($this->repo->existsWhere("email","=", $body->email)){
            return $this->badRequset("אימייל קיים במערכת.!");
        }

        $model = $body->getModelForDb();
        $model["password"] = $this->hash_password($body->password);

        try {
            $this->repo->insert($model)->execute();
            $res = $this->repo->getLastInserted();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->ok($res);
    }

    // DELETE: /api/Accounts/5
    #[a\HttpDelete(":id")]
    function delete(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("user with id:$id not found");
        }

        try {
            $this->repo->delete()->where("id","=",$id)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }
        
        return $this->noContent();
    }
    
    // POST: /api/Accounts
    #[a\HttpPost("login")]
    function login(RequestBody $body){
        if(!isset($body->email) || !isset($body->password) || empty($body->email) || empty($body->password)){
            return $this->badRequset("אימייל וסיסמא נדרשים");
        }

        if(!$this->repo->existsWhere("email", "=", $body->email)){
            return $this->notFound("משתמש עם אימייל:".$body->email." לא נמצא");
        }

        $user = $this->repo
        ->include("warehouses")
        ->thenInclude("warehouse")
        ->where("email","=",$body->email)
        ->single();
        if(!$this->verify_password($body->password, $user->password)){
            return $this->badRequset("סיסמא שגויה");
        }

        $json = json_encode($user);
        $user = json_decode($json, true);
        
        //$user["roles"] = explode(",", $user["roles"]);
        unset($user["password"]);
        unset($user["createDate"]);
        $user['token'] = $this->jwt->generateToken($user);
        $user['expiryTime'] = $this->jwt->get_last_expiration_time();
        
        return $this->ok($user);
    }

    private function hash_password($password)
    {
      // Hash the password using the bcrypt algorithm with the generated salt
      $hash = password_hash($password, PASSWORD_BCRYPT);
  
      // Return the hashed password
      return $hash;
    }
  
    function verify_password($password, $hash)
    {
      return password_verify($password, $hash);
    }
}
?>