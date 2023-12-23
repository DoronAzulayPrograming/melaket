<?php
namespace App\Controllers;

use DafCore\Controller;
use DafCore\Controller\Attributes as a;
use DafCore\RequestBody;
use App\Data\Cipher;
use App\Repositories\BusinessRepository;
use App\Services\InvoicesService;

#[a\Route]
class InvoicesController extends Controller {

    function __construct(
        public Cipher $cipher,
        public InvoicesService $invoicesService
    ) {}
    
    // GET: /Invoices/konimbo/4as5578aa
    #[a\HttpGet("konimbo/:authKey")]
    function index(string $authKey){
        $tempStr = $this->cipher->decrypt($authKey);
        if(str_contains($tempStr,",") == false){
            return $this->badRequset("קוד לא תקין.");
        }
        
        $tempStr = explode(",", $tempStr);

        if(!is_array($tempStr) || count($tempStr) != 2){
            return $this->badRequset("קוד לא תקין.");
        }

        if(!(is_string($tempStr[0]) && intval($tempStr[0]) > 0 ) || 
            !(is_string($tempStr[1]) && intval($tempStr[1]) > 0 )){
            return $this->badRequset("קוד לא תקין.");
        }

        $businessId = $tempStr[0];
        $invoiceNumber = $tempStr[1];

        $data = $this->invoicesService->load($businessId, $invoiceNumber);
        return $this->view("index-".$businessId,[
            "model" =>  $data,
            "invoiceNumber" => $invoiceNumber
        ]);
    }
}
?>