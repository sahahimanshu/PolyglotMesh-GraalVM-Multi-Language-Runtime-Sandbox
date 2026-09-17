package com.polyglotmesh.service;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;
import org.springframework.stereotype.Service;

@Service 
public class PolyglotExecutionService {
public String executePython(String code) {
    try(Context context = Context.newBuilder("python").allowAllAccess(false).build()){
        Value result = context.eval("python",code);
if(result.isString()){
    return result.asString();
}
return result.toString();

    } 
        
    catch (Exception e) {
        return "Python execution error :" + e.getMessage();
    }
}
public String executeJavaScript(String code) {
    try (Context context = Context.newBuilder("js").allowAllAccess(false).build()){
         Value result = context.eval("js", code);

            if (result.isString()) {
                return result.asString();
            }
            return result.toString();
    }
     catch (Exception e) {
            return "JavaScript execution error: " + e.getMessage();
        }
}
}
