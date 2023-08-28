<?php
namespace App\Middlewheres;

use App\Services\JwtService;
use Attribute;
use DafCore\Request;
use DafCore\Response;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class Auth {

    function __construct(public array $roles = [])
    {
        
    }

    function onAction(Request $req, Response $res, JwtService $jwt){
        $headers = apache_request_headers();
        if(isset($headers["Authorization"]) && str_starts_with($headers["Authorization"], "Bearer ")){
            $token = str_replace("Bearer ", "", $headers["Authorization"]);

            try {
                
                $claims = $jwt->validateToken($token);
                
                if($claims !== false){
                    $valid = empty($this->roles) ? true : false;
                    
                    if(!$valid){
                        foreach ($claims->roles as $value) {
                            if(in_array($value,$this->roles))
                            {
                                $valid = true;
                                break;
                            }
                        }
                    }

                    if($valid){
                        $req->user = $claims;
                        return true;
                    } else {
                        $res->forbidden("you are not allowd to go here.");
                    }

                }

            } catch (\Exception $ex) { }
        } 
        
        $res->unauthorized("you need to login.");
        return false;
    }
}

?>