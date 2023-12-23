<?php 
namespace App\Models;

use App\Models\Business\Business;
use DafCore\AutoConstruct; 
use DafDb as a;
use DafDb\OnDeleteAction;

class CodeBinaBusinessProfile extends AutoConstruct { 
    
    #[a\PrimaryKey]
    #[a\ForeignKey('Business','id', OnDeleteAction::CASCADE->value)]
    public int $businessId;
    
    #[\DafCore\Url]
    #[\DafCore\NotNullNotEmpty]
    #[a\NotNull]
    #[a\DefaultValue("")]
    public string $host;

    #[\DafCore\NotNullNotEmpty]
    #[a\NotNull]
    #[a\DefaultValue("")]
    #[\DafCore\Length(64)]
    public string $user;

    #[\DafCore\NotNullNotEmpty]
    #[a\NotNull]
    #[a\DefaultValue("")]
    #[\DafCore\Length(64)]
    public string $password;

    #[\DafCore\NotNullNotEmpty]
    #[a\DefaultValue(0)] // Customer Account Number in Bnext Code Bina ERP, in order to create invoices for the services
    public int $customerNo;

    #[a\DbInclude('Business','Business.id = CodeBinaBusinessProfiles.businessId')]
    public Business $business;
}


class CodeBinaBusinessProfileValidation{
    static $error = "";
    static function Put($data) : bool {
        $msg = self::$error = "";
        $status = true;

        if(!isset($data->businessId) || !is_int($data->businessId) || $data->businessId < 1){
            $status = false;
            $msg .= "field businessId is requierd";
        }

        if(isset($data->host)){
            if(empty($data->host) || !is_string($data->host)){
                $status = false;
                $msg .= "field host is requierd";
            }
            
            if(!preg_match('/^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i', $data->host)) 
            {
                $msg .= "field host must be a valid URL.";
                $status = false;
            }
        }
        if(isset($data->user) && (empty($data->user) || strlen($data->user) > 64))
        {
            $msg .= "field user can't be longer than 64 characters.";
            $status = false;
        }
        if(isset($data->password) && (empty($data->user) || strlen($data->password) > 64)) 
        {
            $msg .= "field password can't be longer than 64 characters.";
            $status = false;
        }
        if(isset($data->customerNo)) 
        {
            if(!is_int($data->customerNo) || $data->customerNo < 1) {
                $msg .= "field customerNo require number greater than 0.";
                $status = false;
            }
        }

        self::$error = $msg;
        return $status;
    }
}
?>