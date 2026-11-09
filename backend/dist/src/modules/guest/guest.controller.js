"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const guest_otp_request_dto_1 = require("./dto/guest-otp-request.dto");
const guest_otp_verify_dto_1 = require("./dto/guest-otp-verify.dto");
const guest_service_1 = require("./guest.service");
let GuestController = class GuestController {
    constructor(guestService) {
        this.guestService = guestService;
    }
    async requestOtp(dto) {
        return this.guestService.requestCheckoutOtp(dto);
    }
    async verifyOtp(dto) {
        return this.guestService.verifyCheckoutOtp(dto);
    }
};
exports.GuestController = GuestController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [guest_otp_request_dto_1.GuestOtpRequestDto]),
    __metadata("design:returntype", Promise)
], GuestController.prototype, "requestOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [guest_otp_verify_dto_1.GuestOtpVerifyDto]),
    __metadata("design:returntype", Promise)
], GuestController.prototype, "verifyOtp", null);
exports.GuestController = GuestController = __decorate([
    (0, common_1.Controller)('api/v1/guest/checkout-otp'),
    __metadata("design:paramtypes", [guest_service_1.GuestService])
], GuestController);
//# sourceMappingURL=guest.controller.js.map