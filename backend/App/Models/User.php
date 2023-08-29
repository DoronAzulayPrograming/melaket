<?php 
namespace App\Models; 

use DafCore as attr;
use App\Models\Business;
use DafDb as a;
use DafCore\AutoConstruct;
use DafCore\AutoConstruct as json;
use DafDb\DateOnly;
use DafDb\OnDeleteAction;

class User extends AutoConstruct { 

    #[a\PrimaryKey]
    #[a\AutoIncrement]
    public int $id;

    #[a\NotNull]
    #[a\ForeignKey('Business','id', OnDeleteAction::CASCADE->value)]
    public int $businessId;

    #[a\NotNull]
    #[a\Length(100)]
    #[a\DefaultValue('')]
    public string $name;

    #[a\Unique]
    #[a\NotNull]
    #[a\Length(191)]
    #[a\DefaultValue('')]
    public string $email;

    #[json\Ignore]
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
    
    #[a\DbInclude('Business','Business.id = Users.businessId')]
    public Business $business;

    #[a\DbIgnore]
    #[json\Name("roles")]
    public array $roleList;

    public function onAfterLoad()
    {
        $this->roleList = explode(",", $this->roles);
    }
}

class UserValidation {
    static $error = "";
    static function Post($user) : bool {
        self::$error = "";
        $msg = "";
        $status = true;

        if(!isset($user->id) || $user->id != 0){
            $msg .= "מזהה הינו שדה חובה ונדרש לערך 0";
            $status = false;
        }

        if(!isset($user->businessId) || (!is_int($user->businessId) || $user->businessId < 1))
        {
            $msg .= "businessId is required, can't be empty, and must be an integer.";
            $status = false;
        }

        if(empty($user->email)){
            $msg .= "כתובת אימייל הינה שדה חובה";
            $status = false;
        }

        if($status && strlen($user->email) > 191){
            $msg .= "כתובת אימייל לא יכולה להכיל יותר מ 191 תווים";
            $status = false;
        }

        if($status && !filter_var($user->email, FILTER_VALIDATE_EMAIL)){
            $msg .= "כתובת אימייל לא תקינה";
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