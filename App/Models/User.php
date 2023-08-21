<?php 
namespace App\Models; 

use DafDb as a;
use DafCore\AutoConstruct;
use DafDb\DateOnly;

class User extends AutoConstruct { 

    #[a\PrimaryKey]
    #[a\AutoIncrement]
    public int $id;

    #[a\Unique]
    #[a\NotNull]
    #[a\Length(191)]
    #[a\DefaultValue('')]
    public string $email;

    #[a\NotNull]
    #[a\Length(255)]
    #[a\DefaultValue('')]
    public string $password;

    #[a\NotNull]
    #[a\DefaultValue('')]
    public string $roles;

    #[a\NotNull]
    #[a\DefaultValue('CURRENT_DATE')]
    public DateOnly $createDate;

    public function setCreateDate(string $date){
        $this->createDate = new DateOnly($date);
    }
}

class UserValidation {
    static $error = "";
    static function Post($user) : bool {
        self::$error = "";
        $msg = "";
        $status = true;

        if(!isset($user->id) || $user->id != 0){
            $msg .= "id field need to be 0 on create";
            $status = false;
        }

        if(empty($user->email) || strlen($user->email) > 191){
            $msg .= "email field is required and has to be no longet then 191 charecters";
            $status = false;
        }

        if(empty($user->password) || strlen($user->password) > 255){
            $msg .= "password field is required and has to be no longer then 255 charecters";
            $status = false;
        }

        if(empty($user->roles) || count($user->roles) < 1){
            $msg .= "roles field is required and has to be array with 1 or more string values";
            $status = false;
        }

        if(empty($user->createDate)){
            $msg .= "createDate field is required and need to be in format [ yyyy-m-d ]";
            $status = false;
        }

        self::$error = $msg;
        return $status;
    }
}
?>