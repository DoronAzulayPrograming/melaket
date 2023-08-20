<?php
namespace App\Controllers\Api;

use App\Models\User;
use App\Models\UserCreateModel;
use App\Models\UserValidation;
use App\Repositories\UsersRepository;
use DafCore\ApiController;
use DafCore\Controller\Attributes as a;
use DafCore\RequestBody;
use DafDb\DateOnly;

#[a\Route(prefix:"api")]
class AccountsApiController extends ApiController {
    private array $roles = ["admin"=>1,"subAdmin"=>1,"member"=>1];

    function __construct(public UsersRepository $repo) {
        // TODO Code 
    }

    // GET: /api/Accounts
    #[a\HttpGet]
    function index(){
        // TODO Code 
        return $this->ok(empty($res = $this->repo->many()) ? "[]" : $res);
    }

    // GET: /api/Accounts/5
    #[a\HttpGet(":id")]
    function details(int $id){
        if(!$this->repo->existsWhere("id","=",$id)){
            return $this->notFound("user with id:$id not found");
        }

        try {
            $user = $this->repo->where("id","=",$id)->single();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        $res = get_object_vars($user);
        $res["roles"] = explode(",", $user->roles);

        return $this->ok($res);
    }

    // PUT: /api/Accounts/5
    #[a\HttpPut(":id")]
    function update(int $id, RequestBody $body){
        // TODO Code 
        if(!isset($body->id) || $body->id != $id)
            return $this->badRequset("id and body id not match.!");

        if(isset($body->createDate))
            unset($body->createDate);

        if(isset($body->roles)){
            if(!is_array($body->roles))
                return $this->badRequset("roles need to be array of strings.!");

            if(count($body->roles) < 1)
                return $this->badRequset("roles need to include atlist one value");

            foreach ($body->roles as $role) {
                if(!array_key_exists($role, $this->roles))
                    return $this->badRequset("roles contain unknon role");
            }

            $body->roles = implode(",", $body->roles);
        }

        $model_vars = get_class_vars(User::class);

        foreach ($body as $key => $value) {
            if(!array_key_exists($key, $model_vars))
                return $this->badRequset("body include unknon props.!");
        }

        try {
            $this->repo->update($body)->where("id","=",$id)->execute();
        } catch (\Exception $ex) {
            return $this->internalError("<h1>Error ". $ex->getMessage() ."</h1>");
        }

        return $this->noContent();
    }

    // POST: /api/Accounts
    #[a\HttpPost]
    function create(UserCreateModel $body){
        $body->id = 0;
        $body->createDate = DateOnly::Now();

        if(!UserValidation::Post($body)){
            return $this->badRequset(UserValidation::$error);
        }

        foreach ($body->roles as $role) {
            if(!array_key_exists($role, $this->roles))
                return $this->badRequset("roles contain unknon role");
        }

        if($this->repo->existsWhere("email","=", $body->email)){
            return $this->badRequset("email already exist.!");
        }
        $model = get_object_vars($body);
        $model["roles"] = $body->rolesToString();

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
}
?>