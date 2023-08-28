<?php 
namespace App\Models; 
 
use DafCore\AutoConstruct;
use DafDb\DateOnly;

class UserCreateModel extends AutoConstruct { 
    
    #[\DafCore\DisplayName("מזהה")]
    #[\DafCore\NotNull]
    #[\DafCore\OnlyEmpty]
    public int $id;

    #[\DafCore\DisplayName("מזהה עסק")]
    #[\DafCore\NotNull]
    #[\DafCore\Range(min:1)]
    public int $businessId;

    #[\DafCore\DisplayName("אימייל")]
    #[\DafCore\NotNull]
    #[\DafCore\Length(191, "כתובת {0} לא יכולה להכיל יותר מ {1} תווים")]
    #[\DafCore\Email]
    public string $email;

    #[\DafCore\DisplayName("סיסמא")]
    #[\DafCore\NotNull]
    #[\DafCore\NotEmpty]
    public string $password;

    #[\DafCore\DisplayName("הרשאות")]
    #[\DafCore\NotNull]
    #[\DafCore\NotEmpty]
    public array $roles;

    public DateOnly $createDate;

    function getModelForDb() : array {
        $arr = (array) $this;
        $arr["roles"] = implode(",", $this->roles);
        return $arr;
    }
}
?>