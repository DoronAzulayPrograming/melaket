<?php
namespace App\Controllers\Api;

use App\Data\Cipher;
use App\Middlewheres\Auth;
use App\Repositories\CodeBinaBusinessProfilesRepository;
use App\Repositories\CodebinaDataRepository;
use App\Repositories\ModelsRepository;
use App\Services\BackgroundDataService;
use App\Services\InvoicesService;
use DafCore\ApiController;
use DafCore\AutoConstruct;
use DafCore\Controller\Attributes as a;
use DafCore\Request;
use DafCore\RequestBody;

#[a\Route(prefix:"api")]
class KonimboApiController extends ApiController {
    function __construct(
        public Cipher $cipher,
        public CodeBinaBusinessProfilesRepository $cbrepo,
        public ModelsRepository $mrepo,
        public BackgroundDataService $bgDataService,
        public InvoicesService $invoicesService,
        public CodebinaDataRepository $codeBinaRepo,
    ) {}

    // GET: /api/Konimbo/orders/????
    #[Auth]
    #[a\HttpGet("orders/:status")]
    function getBusinessOrders(Request $req, string $status){
        //$this->bgDataService->loadBusiness($req->user->businessId);
        //$this->bgDataService->loadCheetah($req->user->businessId);
        try {
            $res = $this->bgDataService->getKonimboOrders($req->user->businessId, $status);
        } catch (\Throwable $th) {
            return $this->internalError($th->getMessage());
        }

        return $this->ok(empty($res) ? "[]" : $res);
    }

    // PUT: /api/Konimbo/status/31312
    #[Auth]
    #[a\HttpPut("/status/:orderId")]
    function update_status(int $orderId, StatusModel $body) {
		$update_status = json_encode(
			array(
				'token' => $body->token,
				'order' => array(
					'statuses' => array(
						array(
							'status_option_title' => $body->status, 
							'username' => "Orders Management Integration",
							'comment' => $body->text
						)
					),
					'shipping_code' => isset($body->shipment_tracking) ? $body->shipment_tracking : '',
					'invoice_code' => isset($body->invoice) ? $body->invoice : ''
				)
			)
		);
		$ch = curl_init();
		curl_setopt_array($ch, [
            CURLOPT_URL => 'https://api.konimbo.co.il/v1/orders/'.$orderId,
            CURLOPT_RETURNTRANSFER => true, 
            CURLOPT_HTTPHEADER => array("Content-Type: application/json","Content-Length: ".strlen($update_status)), 
            CURLOPT_CUSTOMREQUEST => 'PUT', 
            CURLOPT_POSTFIELDS => $update_status, 
            CURLOPT_SSL_VERIFYHOST => FALSE, 
            CURLOPT_SSL_VERIFYPEER => FALSE
        ]);
		$resp = curl_exec($ch);
		curl_close($ch);

		return $this->ok($resp);
    }

    // PUT: /api/Konimbo/address
    #[Auth]
    #[a\HttpPut("/address/:id")]
    function update_address(int $id, AddressModel $body) {
        $data = (array) $body;
        unset($data['token']);
        if(!isset($body->apartment))
            unset($data['apartment']);
        else $data['apartment'] = strval($body->apartment);

        $data['street_number'] = strval($body->street_number);
        
        $token = $body->token;
        $json = [
            "token" => $token,
            "order" => [
                "data_record_var" => [
                    "address" => $data
                ]
            ]
        ];

        $json = json_encode($json);

		$ch = curl_init();
		curl_setopt_array($ch,
            [
                CURLOPT_URL => 'https://api.konimbo.co.il/v1/orders/'.$id,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => array("Content-Type: application/json","Content-Length: ".strlen($json)), 
                CURLOPT_CUSTOMREQUEST => 'PUT', CURLOPT_POSTFIELDS => $json, 
                CURLOPT_SSL_VERIFYHOST => FALSE, 
                CURLOPT_SSL_VERIFYPEER => FALSE
            ]
        );
		$res = json_decode(curl_exec($ch), true);
		curl_close($ch);

        if(!isset($res['data_record_var']['address']))
            $this->badRequset("כתובת לא עודכנה: סיבה - אין כתובת במשתנים");

        if($res['data_record_var']['address'] !== $data)
            $this->badRequset("כתובת לא עודכנה: סיבה - ערכים לא תואמים למשתנים");
        
        return $this->ok($json);
    }

    // PUT: /api/Konimbo/point
    #[Auth]
    #[a\HttpPut("/point/:id")]
    function update_point(int $id, PointModel $body) {

        $json = [
            "token" => $body->token,
            "order" => [
                "data_record_var" => [
                    "point" => strval($body->point)
                ]
            ]
        ];

        $json = json_encode($json);

		$ch = curl_init();
		curl_setopt_array($ch,
            [
                CURLOPT_URL => 'https://api.konimbo.co.il/v1/orders/'.$id,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => array("Content-Type: application/json","Content-Length: ".strlen($json)), 
                CURLOPT_CUSTOMREQUEST => 'PUT', CURLOPT_POSTFIELDS => $json, 
                CURLOPT_SSL_VERIFYHOST => FALSE, 
                CURLOPT_SSL_VERIFYPEER => FALSE
            ]
        );
		$res = json_decode(curl_exec($ch), true);
		curl_close($ch);

        if(!isset($res['data_record_var']['point']))
            $this->badRequset("נקודה לא עודכנה: סיבה - אין נקודת חלוקה במשתנים");

        if($res['data_record_var']['point'] != $body->point)
            $this->badRequset("נקודה לא עודכנה: סיבה - ערכים לא תואמים למשתנים");
        
        return $this->ok($json);
    }

    // POST: /api/Konimbo/debit-order/132132
    #[Auth]
    #[a\HttpPost("/debit-order/:orderId")]
    function debit_order(Request $req,int $orderId, RequestBody $body){ // 
        if(!$this->mrepo->where("businessId","=",$req->user->businessId)->where("name","=","קונימבו")->exists())
            return $this->badRequset("לעסק אין מודל קונימבו פעיל.");

        $konimboModel = $this->mrepo->where("businessId","=",$req->user->businessId)->where("name","=","קונימבו")->single();

        $url = "https://secure.konimbo.co.il/credit_guard_xmls/".$konimboModel->data->subDomain."/".$orderId.'/debit?token='.$konimboModel->data->debitToken.'&total_price='.floatval($body->totalPrice);
		
        $ch = curl_init();
		curl_setopt_array($ch, [
			CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true, 
            CURLOPT_HTTPHEADER => ['Access-Control-Allow-Origin: *','Content-Type: application/json']
		]);

		$response = json_decode(curl_exec($ch), true);
		curl_close($ch);
        
        $res = new \stdClass();
        $res->result = isset($response['notice']) && $response['notice'] == 'התשלום נקלט בהצלחה';
        
        return $this->ok($res);
    }

    // POST: /api/Konimbo/invoice/132132
    #[Auth]
    #[a\HttpPost("/invoice/:orderId")]
    function invoice(Request $req,int $orderId, InvoiceModel $body)
    {
        if(!$this->cbrepo->existsWhere("businessId","=", $req->user->businessId)){
            return $this->badRequset("לעסק אין הגדרות קוד בינה");
        }

        $binaSettings = $this->cbrepo->where("businessId","=", $req->user->businessId)->single();

        /* Creating the invoice */
        $postData = [];
        $postData["Main"]["Warehouse"] = $body->warehouse->warehouseId;
        $postData["Main"]["SortingNumber"] = $orderId;
        $postData["Main"]["CustomerNo"] = $body->codeBinaCustomerNo;
        
        $postData["Main"]["Remark"] = 'מחסן: ' . $body->warehouse->warehouseName . ' | מלקט: ' . $req->user->name;

        $postData["Main"]["Currency"] = array("Type" => 1);
        $postData["Main"]["DocType"] = 320; //320 //100
        $postData["Main"]["VatPercent"] = 17; // TODO database
        $postData["Main"]["DiscountPercent"] = 0;
        $postData["Main"]["Price"] = number_format($body->totalPrice, 3, '.', '');
        $postData["Main"]["PriceBeforeVat"] = number_format($body->totalPrice / 1.17, 3, '.', ''); // TODO database

        $postData["Main"]["CustomerPhone"] = $body->phone;

        if(!empty($body->additionalInputs->extra_full_name)){
            $postData["Main"]["CustomerName"] = $body->additionalInputs->extra_full_name;   
            $postData["Main"]["FreeTxt"] = !empty($body->additionalInputs->extra_identity) ? $body->additionalInputs->extra_identity : '';
            $postData["Main"]["FreeLbl"] = !empty($body->additionalInputs->extra_identity) ? 'ח.פ/ת.ז' : '';
        }

        else $postData["Main"]["CustomerName"] = $body->name;

        if(isset($body->shippingAddress)){
            $postData["Main"]["CustomerCity"] = $body->shippingAddress->city;
            $postData["Main"]["CustomerStreet"] = $body->shippingAddress->street. ' ' . $body->shippingAddress->street_number . (!empty($body->shippingAddress->apartment) ? '/' . $body->shippingAddress->apartment : '');
            $postData["Main"]["CustomerZipCode"] = $body->shippingAddress->zip_code;
        }else{
            $postData["Main"]["CustomerCity"] = "נקודת איסוף";
            $postData["Main"]["CustomerStreet"] = "נקודת איסוף";
            $postData["Main"]["CustomerZipCode"] = "0000000";
        }

        if (!empty($body->additionalInputs->extra_identity) && $body->totalPrice > 5000) {
            $postData["Main"]["IdentityCard"] = $body->additionalInputs->extra_identity;
        }

        foreach ($body->itemsInvoice as $item) {
            if (isset($item->type) && $item->type == 'shipping') continue;

            $discount_row = 0;
            $price_unit = number_format(floatval($item->price / 1.17), 3, '.', '');
            $price_line = number_format($item->quantity * number_format(floatval($item->price / 1.17), 3, '.', ''), 3, '.', '');
            foreach ($body->discountsInvoice as $discount) {
                if (isset($discount->line_item_id) && $discount->line_item_id == $item->line_item_id && $discount->price > 0) {
                    if ($discount->discount_type == '%') {
                        $discount->discount_value = $discount->price;
                    }
                    $discount_row = number_format((floatval(number_format(($discount->discount_value / 1.17), 3, '.', '')) / floatval(number_format(floatval(($item->quantity * $item->price) / 1.17), 3, '.', ''))) * 100, 3, '.', '');
                    $price_line = number_format($price_line - $price_line / 100 * $discount_row, 3, '.', '');
                }
            }
            $postData["Details"][] = array(
                "Amount" => $item->quantity,
                "ItemNo" => $item->second_code,
                "DiscountPercent" => $discount_row,
                "ItemName" => $item->title,
                "PriceUnit" => $price_unit,
                "Price" => $price_line,
                "ItemMustVat" => true,
                "Currency" => array("Type" => 1),
                "Warehouse" => $body->warehouse->warehouseId
            );


            foreach ($body->items as $itemExtraData) {
                if ($itemExtraData->line_item_id == $item->line_item_id) {

                    foreach ($itemExtraData->serialNumbers as $code) {
                        $serial = explode(',', $code);
                        foreach ($serial as $sn) {
                            $postData["Details"][] = array("ItemName" => 'מספר סידורי: ' . $sn);
                        }
                    }

                }
            }
        }

        foreach ($body->discountsInvoice as $discount) {
            if (empty($discount->line_item_id) && $discount->price > 0) {
                if ($discount->discount_type == '%') {
                    $discount->discount_value = $discount->price;
                }
                $postData["Details"][] = array(
                    "Amount" => 1,
                    "ItemNo" => $body->codeBinaDiscountItemNumber,
                    "DiscountPercent" => 0,
                    "ItemName" => $discount->title,
                    "PriceUnit" => number_format(($discount->discount_value / 1.17) * -1, 3, '.', ''),
                    "Price" => number_format(($discount->discount_value / 1.17) * -1, 3, '.', ''),
                    "ItemMustVat" => true,
                    "Currency" => array("Type" => 1),
                    "Warehouse" => $body->warehouse->warehouseId
                );
            }
        }

        //SHIPPING ITEM !!!!!
        $postData["Details"][] = array(
            "Amount" => 1 * ($body->shipping->packageAmount ?? 1),
            "ItemNo" => isset($body->shipping->bigOrder) && $body->shipping->bigOrder == 1 ? $body->codeBinaB2CHarigItemNumber : $body->shipping->code,
            "DiscountPercent" => 0,
            "ItemName" => $body->shipping->title,
            "PriceUnit" => number_format(($body->shipping->price / 1.17), 3, '.', ''),
            "Price" => number_format(($body->shipping->price / 1.17), 3, '.', ''),
            "ItemMustVat" => true,
            "Currency" => array("Type" => 1),
            "Warehouse" => $body->warehouse->warehouseId
        );
        
        if (!empty($body->additionalInputs->extra_full_name)) {
            $postData["Details"][] = array("ItemName" => '@על שם: ' . $body->name);
        }

        //$oldPriceBeforeVat = $postData["Main"]["PriceBeforeVat"];
        $fixedInvoicePrice = 0;

        foreach ($postData["Details"] as $item) {
            $fixedInvoicePrice += isset($item['Price']) ? $item['Price'] : 0;
        }
        $postData["Main"]["PriceBeforeVat"] = number_format($fixedInvoicePrice, 3, '.', '');


        if ($body->paymentStatus == 'אשראי - מלא' || $body->paymentStatus == 'applepay - מלא' || $body->paymentStatus == 'googlepay - מלא' || $body->paymentStatus == 'Apple pay - מלא' || $body->paymentStatus == 'Google pay - מלא') {
            $postData["Receipts"][] = array(
                '__type' => 'Credit',
                'Sum' => number_format($body->totalPrice, 3, '.', ''),
                'CreditNo' => $body->credit_card_details['last_4d'],
                'CustomerID' => $body->credit_card_details['personal_id'],
                'SolekNo' => $body->codeBinaCreditCashier,
                'TransactionType' => 1
            );
        } else if ($body->paymentStatus == 'פייפאל - מלא') {
            $postData["Receipts"][] = array(
                '__type' => 'Credit',
                'Sum' => number_format($body->totalPrice, 3, '.', ''),
                'SolekNo' => $body->codeBinaPaypalCashier,
                'TransactionType' => 1
            );
        } else {
            $postData["Receipts"][] = array(
                '__type' => 'Credit',
                'Sum' => number_format($body->totalPrice, 3, '.', ''),
                'SolekNo' => $body->codeBinaCreditCashier,
                'TransactionType' => 1
            );
        }

        if($postData["Main"]["DocType"] == 100) unset($postData["Receipts"]);

        $kodBinaJSON = json_encode($postData);
        

        try {
            
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $binaSettings->host . '/CodeBina.svc/DocumentRest/CreateDocument',
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => array("Content-Type: application/json", "Authorization: Basic " . base64_encode($binaSettings->user.":".$binaSettings->password)),
                CURLOPT_POSTFIELDS => $kodBinaJSON,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_SSL_VERIFYPEER => false
            ]);

            $resp = curl_exec($ch);
            curl_close($ch);

        } catch (\Throwable $th) {
            return $this->internalError($th->getMessage());
        }

        if(is_numeric($resp) && $resp != 0){
            $obj = new \stdClass();
            $obj->invoiceNo = $resp; // invoice number or false 
            $obj->data = $this->loadItemsBarcodes($req->user->businessId, $postData);
            $obj->url = "";

            if($this->invoicesService->save($req->user->businessId, $obj)){
                $obj->url = "invoices/konimbo/".$this->cipher->encrypt($req->user->businessId.",".$resp);
            }

            unset($obj->data);
            return $this->ok($obj);
        }
            

        return $this->badRequset("בקשה לא תקינה");
    }


    function loadItemsBarcodes(int $businessId, $data){
        $items = $this->codeBinaRepo->where("businessId","=",$businessId)->many();
        
        $data["Details"] = array_map(function($item) use ($items){
            if(isset($item['ItemNo'])){
                $temp = daf_array_find($items, function($i) use ($item){
                    return $i->ItemNo == $item['ItemNo'];
                });
                if($temp){
                    $item['Barcode'] = $temp->Barcode;
                }else{
                    $item['Barcode'] = $item['ItemNo'];
                }
            }else{
                $item['Barcode'] = "";
            }
            return $item;

        }, $data["Details"]);

        return $data;
    }

    #[Auth]
    #[a\HttpPost("/sendEmail")]
    function sendEmail(SendEmailModel $body){
        $status_email = '';
		$email = new \SendGrid\Mail\Mail(); 
		$email->setFrom($body->sendGrid->email, "שירות לקוחות ".$body->shopName); // send from email - 1st parameter, שירות לקוחות shopName - 2st parameter
		$email->setSubject($body->subject); // subject
		$email->addTo($body->email); // email of customer
		$email->addContent("text/html", $body->tamplate); // template
		$sendgrid = new \SendGrid($body->sendGrid->token); // sendgrid token
		try {
			$response = $sendgrid->send($email);
			$status_email = $response->statusCode()."<br />".json_encode($response->headers())."<br />".json_encode($response->body());
            return $this->Response()->status(200)->send($status_email);
		} catch (\Exception $e) {
			$status_email = $e->getMessage();
            return $this->Response()->status(400)->send($status_email);
		}
    }
}

class SendEmailSendGridModel extends AutoConstruct {

    #[\DafCore\NotNullNotEmpty]
    public string $token;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Email]
    public string $email;

}

class SendEmailModel extends AutoConstruct {
    #[\DafCore\NotNullNotEmpty]
    public string $shopName;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Email]
    public string $email;

    #[\DafCore\NotNullNotEmpty]
    public string $subject;

    #[\DafCore\NotNullNotEmpty]
    public string $tamplate;

    public SendEmailSendGridModel $sendGrid;
    public function setSendGrid(array $data){
        $this->sendGrid = new SendEmailSendGridModel($data);
    }
}

class ItemExtraDetails extends AutoConstruct
{
    public int $line_item_id;

    public array $serialNumbers;
}

class InvoiceDiscountItem extends AutoConstruct
{
    public string $title;
    public int $line_item_id;

    public float $price;

    public string $discount_type;
    public float $discount_value;
}

class InvoiceItem extends AutoConstruct
{
    public int $line_item_id;

    public float $price;

    public float $unit_price;

    public int $quantity;

    public string $second_code;

    public string $title;

    public string $type;
}

class InvoiceWarehouse extends AutoConstruct
{
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    public int $warehouseId;

    #[\DafCore\NotNullNotEmpty]
    public string $warehouseName;
}

class AdditionalInputs extends AutoConstruct
{
    public string $extra_full_name;
    public string $extra_identity;
}

class InvoiceAddress extends AutoConstruct
{
    public string $zip_code;

    #[\DafCore\NotNullNotEmpty]
    public string $city;

    #[\DafCore\NotNullNotEmpty]
    public string $street;

    #[\DafCore\NotNullNotEmpty]
    public string $street_number;

    public string $apartment;
}

class InvoiceShippingOptions extends AutoConstruct
{
    //order shipping
    public string $code;
    public float $price; 
    public string $title;
    //*

    public bool $bigOrder;
    public int $packageAmount;
    //public bool $copyNoteToShipping;
    
    //#[\DafCore\NotNull]
    //public bool $sendTrackingMailToCustomer;
}

class InvoiceModel extends AutoConstruct
{
    //req
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(0.01)]
    public float $totalPrice;

    #[\DafCore\NotNullNotEmpty]
    public string $name;

    #[\DafCore\NotNullNotEmpty]
    public string $paymentStatus;

    public array $credit_card_details;
    
    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaDiscountItemNumber;
    
    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaB2CHarigItemNumber;
    
    public int $codeBinaPaypalCashier;
    
    #[\DafCore\NotNullNotEmpty]
    public int $codeBinaCreditCashier;

    #[\DafCore\NotNullNotEmpty]
    public string $phone;

    #[\DafCore\Range(1)]
    #[\DafCore\NotNullNotEmpty]
    public int $codeBinaCustomerNo;

    public InvoiceWarehouse $warehouse;
    
    public function setWarehouse(array $data){
        $this->warehouse = new InvoiceWarehouse($data);
    }

    public AdditionalInputs $additionalInputs;

    public function setAdditionalInputs(array $data){
        $this->additionalInputs = new AdditionalInputs($data);
    }

    public int $shippingPoint;

    public InvoiceAddress $shippingAddress;

    public function setShippingAddress(array $data){
        $this->shippingAddress = new InvoiceAddress($data);
    }

    public array $itemsInvoice;

    public function setItemsInvoice(array $data){
        foreach ($data as $item) {
            $this->itemsInvoice[] = new InvoiceItem($item);
        }
    }

    public array $discountsInvoice = [];

    public function setDiscountsInvoice(array $data){
        foreach ($data as $item) {
            $this->discountsInvoice[] = new InvoiceDiscountItem($item);
        }
    }

    public array $items;

    public function setItems(array $data){
        foreach ($data as $item) {
            $this->items[] = new ItemExtraDetails($item);
        }
    }

    public InvoiceShippingOptions $shipping;

    public function setShipping(array $data){
        $this->shipping = new InvoiceShippingOptions($data);
    }
}

class StatusModel extends AutoConstruct
{

    #[\DafCore\NotNullNotEmpty]
    public string $token;

    #[\DafCore\NotNullNotEmpty]
    public string $status;

    #[\DafCore\NotNullNotEmpty]
    public string $text;

    public int $invoice;
    public int $shipment_tracking;
}

class PointModel extends AutoConstruct
{

    #[\DafCore\NotNullNotEmpty]
    public string $token;

    #[\DafCore\NotNullNotEmpty]
    public int $point;
}

class AddressModel extends AutoConstruct
{

    #[\DafCore\NotNullNotEmpty]
    public string $token;

    #[\DafCore\NotNullNotEmpty]
    public string $city;

    #[\DafCore\NotNullNotEmpty]
    public string $street;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    public int $street_number;
    public int $apartment;
}
