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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestOtpRequestDto = void 0;
const class_validator_1 = require("class-validator");
class GuestOtpRequestDto {
}
exports.GuestOtpRequestDto = GuestOtpRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Phone number is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^(0[3|5|7|8|9])[0-9]{8}$/, {
        message: 'Invalid Vietnamese phone number format (must be 10 digits starting with 03, 05, 07, 08, 09)',
    }),
    __metadata("design:type", String)
], GuestOtpRequestDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], GuestOtpRequestDto.prototype, "email", void 0);
//# sourceMappingURL=guest-otp-request.dto.js.map