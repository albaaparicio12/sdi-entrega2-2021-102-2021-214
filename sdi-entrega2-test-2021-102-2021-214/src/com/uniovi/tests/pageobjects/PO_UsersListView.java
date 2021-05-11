package com.uniovi.tests.pageobjects;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class PO_UsersListView extends PO_NavView{
	
	static public void deleteUserByName(WebDriver driver, String user) {		
		driver.navigate().to("https://localhost:8081/usuario/listado");
		clickOptionWithId(driver, user, "id");
		By boton = By.className("btn");
		driver.findElement(boton).click();
		driver.navigate().to("https://localhost:8081/usuario/listado");
	}
	
	static public void deleteUsers(WebDriver driver, String[] users) {		
		driver.navigate().to("https://localhost:8081/usuario/listado");
		for(int i=0; i<users.length; i++) {
			clickOptionWithId(driver, users[i], "id");
		}
		By boton = By.className("btn");
		driver.findElement(boton).click();
		driver.navigate().to("https://localhost:8081/usuario/listado");
	}
	
	static public void deleteUserByFirstPosition(WebDriver driver) {		
		getUserByFirstPosition(driver).click();
		By boton = By.className("btn");
		driver.findElement(boton).click();
		driver.navigate().to("https://localhost:8081/usuario/listado");
	}
	
	static public String getUserEmailByFirstPosition(WebDriver driver) {
		return getUserByFirstPosition(driver).getAttribute("id");
	}
	
	static private WebElement getUserByFirstPosition(WebDriver driver) {		
		driver.navigate().to("https://localhost:8081/usuario/listado");
		List<WebElement> elementos = driver.findElements(By.xpath("/html/body/div/div/form/table/tbody/tr/th[5]/input"));
		return elementos.get(0);
	}
	

}